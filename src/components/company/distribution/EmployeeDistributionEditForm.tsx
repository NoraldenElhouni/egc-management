import React, { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calcDistribution,
  calcEmployeeEarnings,
  DistributionProject,
} from "../../../hooks/projects/useProjectsDistribute";
import { formatCurrency } from "../../../utils/helpper";
import { Currency } from "../../../types/global.type";
import EmployeePicker from "./EmployeePicker";
import { supabase } from "../../../lib/supabaseClient";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

// ─── Schema ──────────────────────────────────────────────────────────────────

const rowSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["bank", "company", "employee"]),
  employeeId: z.string().optional(),
  currency: z.enum(["LYD", "USD", "EUR"]),
  total: z.number(),
  percentage: z
    .number()
    .min(0, "النسبة لا يمكن أن تكون سالبة")
    .max(100, "النسبة لا تتجاوز 100"),
  amount: z.number().min(0),
});

const formSchema = z
  .object({ rows: z.array(rowSchema) })
  .superRefine((data, ctx) => {
    CURRENCIES.forEach((currency) => {
      const indices = data.rows
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.currency === currency);

      if (indices.length === 0) return;

      const sum = indices.reduce(
        (acc, { r }) => acc + (Number(r.percentage) || 0),
        0,
      );
      const rounded = Math.round(sum * 100) / 100;

      if (rounded !== 100) {
        const lastIndex = indices[indices.length - 1].i;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع نسب ${currency} يجب أن يساوي 100% (الحالي: ${rounded.toFixed(2)}%)`,
          path: ["rows", lastIndex, "percentage"],
        });
      }
    });
  });

type FormValues = z.infer<typeof formSchema>;

// ─── Main Form ────────────────────────────────────────────────────────────────

interface Props {
  project: DistributionProject;
  onSave?: (rows: FormValues["rows"]) => void;
}

const EmployeeDistributionEditForm = ({ project, onSave }: Props) => {
  const [pickerCurrency, setPickerCurrency] = useState<Currency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null); // rowIndex being removed

  // ── Build default rows ────────────────────────────────────────────────────
  const defaultRows = useMemo<FormValues["rows"]>(() => {
    const rows: FormValues["rows"] = [];

    CURRENCIES.forEach((currency) => {
      const dist = calcDistribution(project, currency);
      if (dist.total === 0) return;

      const employees = calcEmployeeEarnings(project, currency);

      rows.push({
        id: `${currency}-bank`,
        label: "🏦 البنك / الاحتياطي",
        type: "bank",
        currency,
        total: dist.total,
        percentage: project.default_bank_percentage,
        amount: dist.bank,
      });

      rows.push({
        id: `${currency}-company`,
        label: "🏢 الشركة",
        type: "company",
        currency,
        total: dist.total,
        percentage: project.default_company_percentage,
        amount: dist.company,
      });

      employees.forEach((emp) => {
        rows.push({
          id: `${currency}-employee-${emp.employeeId}`,
          label: `👤 ${emp.name}`,
          type: "employee",
          employeeId: emp.employeeId,
          currency,
          total: dist.total,
          percentage: Number(emp.assignmentPct || 0),
          amount: emp.earning,
        });
      });
    });

    return rows;
  }, [project]);

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rows: defaultRows },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  const watchedRows = watch("rows");

  // ── Group rows by currency ────────────────────────────────────────────────
  const groupedByCurrency = CURRENCIES.map((currency) => ({
    currency,
    rows: fields
      .map((field, index) => ({ ...field, index }))
      .filter((row) => row.currency === currency),
  })).filter((group) => group.rows.length > 0);

  // ── Add employee ──────────────────────────────────────────────────────────
  const handleAddEmployee = async (
    currency: Currency,
    employeeId: string,
    name: string,
    percentage: number,
  ) => {
    const { error } = await supabase.from("project_assignments").insert({
      project_id: project.id,
      user_id: employeeId,
      percentage,
      project_role_id: "b872f455-2ceb-432e-a72d-fd35d0582e0c",
    });

    if (error) {
      console.error("Error adding project assignment:", error);
      window.alert("حدث خطأ أثناء إضافة الموظف. الرجاء المحاولة مرة أخرى.");
      return;
    }

    const total = watchedRows.find((r) => r.currency === currency)?.total ?? 0;
    append({
      id: `${currency}-employee-${employeeId}-${Date.now()}`,
      label: `👤 ${name}`,
      type: "employee",
      employeeId,
      currency,
      total,
      percentage,
      amount: Number(((percentage / 100) * total).toFixed(2)),
    });
  };

  // ── Remove employee ───────────────────────────────────────────────────────
  const handleRemove = async (rowIndex: number) => {
    const row = watchedRows[rowIndex];
    if (row.type !== "employee" || !row.employeeId) return;

    setIsRemoving(rowIndex);
    const { error } = await supabase
      .from("project_assignments")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", row.employeeId);
    setIsRemoving(null);

    if (error) {
      console.error("Error removing project assignment:", error);
      window.alert("حدث خطأ أثناء حذف الموظف. الرجاء المحاولة مرة أخرى.");
      return;
    }

    remove(rowIndex);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // 1. Update all employee assignment percentages in parallel
      if (!project.project_assignments) {
        window.alert("بيانات المشروع غير كاملة. لا يمكن تحديث التوزيع.");
        return;
      }
     
      const employeeUpdates = values.rows
        .filter((r) => r.type === "employee" && r.employeeId)
        .map((row) =>
          supabase
            .from("project_assignments")
            .update({ percentage: row.percentage })
            .eq("project_id", project.id)
            .eq("user_id", row.employeeId as string),
        );

      const assignmentResults = await Promise.all(employeeUpdates);
      const assignmentError = assignmentResults.find((r) => r.error)?.error;

      if (assignmentError) {
        console.error("Error updating assignments:", assignmentError);
        window.alert(
          "حدث خطأ أثناء تحديث بيانات الموظفين. الرجاء المحاولة مرة أخرى.",
        );
        return;
      }

      // 2. Update project-level bank / company percentages
      // These are shared across currencies so we read from the first match
      const bankPct =
        values.rows.find((r) => r.type === "bank")?.percentage ?? 0;
      const companyPct =
        values.rows.find((r) => r.type === "company")?.percentage ?? 0;

      const { error: projectError } = await supabase
        .from("projects")
        .update({
          default_bank_percentage: bankPct,
          default_company_percentage: companyPct,
        })
        .eq("id", project.id);

      if (projectError) {
        console.error("Error updating project:", projectError);
        window.alert(
          "حدث خطأ أثناء تحديث بيانات المشروع. الرجاء المحاولة مرة أخرى.",
        );
        return;
      }

      onSave?.(values.rows);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errs: any) => {
    console.warn("❌ Zod blocked submit — errors:", errs);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {pickerCurrency && (
        <EmployeePicker
          currency={pickerCurrency}
          total={
            watchedRows.find((r) => r.currency === pickerCurrency)?.total ?? 0
          }
          existingIds={watchedRows
            .filter(
              (r) => r.currency === pickerCurrency && r.type === "employee",
            )
            .map((r) => r.employeeId)
            .filter((id): id is string => Boolean(id))}
          onAdd={(empId, name, pct) =>
            handleAddEmployee(pickerCurrency, empId, name, pct)
          }
          onClose={() => setPickerCurrency(null)}
        />
      )}

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-4"
        dir="rtl"
      >
        {groupedByCurrency.map((group) => {
          const currencyRows =
            watchedRows?.filter((r) => r.currency === group.currency) ?? [];
          const total = currencyRows[0]?.total ?? 0;
          const currentSum = currencyRows.reduce(
            (sum, row) => sum + (Number(row.amount) || 0),
            0,
          );
          const percentageSum = currencyRows.reduce(
            (sum, row) => sum + (Number(row.percentage) || 0),
            0,
          );
          const roundedPctSum = Math.round(percentageSum * 100) / 100;
          const isValid = roundedPctSum === 100;

          return (
            <div key={group.currency} className="rounded-md border p-3">
              {/* Header */}
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                  {group.currency}
                </span>
                <div className="text-xs font-semibold text-gray-700 space-y-0.5 text-left">
                  <div>الإجمالي: {formatCurrency(total, group.currency)}</div>
                  <div>الموزع: {formatCurrency(currentSum, group.currency)}</div>
                  <div
                    className={`font-bold ${isValid ? "text-green-600" : "text-red-500"}`}
                  >
                    مجموع النسب: {roundedPctSum.toFixed(2)}%{" "}
                    {isValid
                      ? "✓"
                      : `(${(100 - roundedPctSum).toFixed(2)}% متبقي)`}
                  </div>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-right text-gray-500">
                    <th className="px-2 py-2">الجهة</th>
                    <th className="px-2 py-2 w-28">النسبة %</th>
                    <th className="px-2 py-2 w-32">المبلغ</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {group.rows.map((row) => {
                    const rowIndex = row.index;
                    const rowData = watchedRows?.[rowIndex];
                    const rowType = rowData?.type;
                    const percentageError =
                      errors.rows?.[rowIndex]?.percentage?.message;
                    const removing = isRemoving === rowIndex;

                    return (
                      <tr
                        key={row.id}
                        className={
                          removing
                            ? "opacity-40 pointer-events-none text-right"
                            : rowType === "bank"
                              ? "bg-yellow-50 text-right"
                              : rowType === "company"
                                ? "bg-green-50 text-right"
                                : "text-right"
                        }
                      >
                        <td className="px-2 py-2 font-medium">
                          {rowData?.label}
                        </td>

                        {/* Percentage — drives amount on change */}
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...register(`rows.${rowIndex}.percentage`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const pct = parseFloat(e.target.value) || 0;
                                const t = watchedRows?.[rowIndex]?.total ?? 0;
                                setValue(
                                  `rows.${rowIndex}.amount`,
                                  Number(((pct / 100) * t).toFixed(2)),
                                  { shouldDirty: true },
                                );
                              },
                            })}
                            className={`w-full rounded border px-2 py-1 text-right tabular-nums outline-none focus:ring-1 ${
                              percentageError
                                ? "border-red-400 focus:ring-red-400"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                          {percentageError && (
                            <p className="mt-1 text-[10px] text-red-500 leading-tight">
                              {percentageError}
                            </p>
                          )}
                        </td>

                        {/* Amount — read-only, auto-calculated */}
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.01"
                            readOnly
                            {...register(`rows.${rowIndex}.amount`, {
                              valueAsNumber: true,
                            })}
                            className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-right tabular-nums outline-none cursor-default"
                          />
                        </td>

                        {/* Remove — employee rows only */}
                        <td className="px-1 py-2 text-center">
                          {rowType === "employee" && (
                            <button
                              type="button"
                              disabled={removing}
                              onClick={() => handleRemove(rowIndex)}
                              className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors text-sm leading-none"
                              title="حذف"
                            >
                              {removing ? "…" : "✕"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-gray-50 text-right font-semibold">
                    <td className="px-2 py-2" colSpan={2}>
                      المجموع
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {formatCurrency(currentSum, group.currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>

              <button
                type="button"
                onClick={() => setPickerCurrency(group.currency as Currency)}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <span className="text-base leading-none">+</span> إضافة موظف
              </button>
            </div>
          );
        })}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </>
  );
};

export default EmployeeDistributionEditForm;