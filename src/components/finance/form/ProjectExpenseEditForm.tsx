import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useProjectExpenseActions } from "../../../hooks/projects/useBookProjects";
import { useExpenses } from "../../../hooks/settings/useExpenses";
import { useContractors } from "../../../hooks/useContractors";
import { useVendors } from "../../../hooks/useVendors";

import {
  updateProjectExpense,
  type UpdateProjectExpenseValues,
} from "../../../types/schema/ProjectBook.schema";
import type { Currency, ExpenseType, Phase } from "../../../types/global.type";

import { NumberField } from "../../ui/inputs/NumberField";
import { SelectField } from "../../ui/inputs/SelectField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { DateField } from "../../ui/inputs/DateField";
import Button from "../../ui/Button";

interface ProjectExpenseEditFormProps {
  projectId: string;
  expense_id: string; // ✅ ID بند المصروف في جدول expenses
  description?: string | null;
  total_amount?: number | null;
  expense_date?: string | null;
  expense_type: ExpenseType;
  phase: Phase;
  currency: Currency | null;

  contractor_id?: string | null;
  expense_ref_id?: string | null;
  vendor_id?: string | null;
}

const ProjectExpenseEditForm = (props: ProjectExpenseEditFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { updateExpense } = useProjectExpenseActions();

  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();

  const {
    contractors,
    loading: contractorsLoading,
    error: contractorsError,
  } = useContractors();

  const {
    vendors,
    loading: vendorsLoading,
    error: vendorsError,
  } = useVendors();

  // ✅ guard: no currency => no edit
  if (props.currency === null) {
    return (
      <div className="text-red-500 text-sm">
        لا يمكن تعديل المصروف لأن العملة غير متوفرة. الرجاء إضافة عملة للمصروف
        أولاً.
      </div>
    );
  }

  const defaultDate = useMemo(() => {
    if (props.expense_date) return props.expense_date;
    return new Date().toISOString().split("T")[0];
  }, [props.expense_date]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UpdateProjectExpenseValues>({
    resolver: zodResolver(updateProjectExpense),
    defaultValues: {
      expense_id: props.expense_id,
      description: props.description || "",
      total_amount: props.total_amount || 0,
      expense_date: defaultDate,
      expense_type:
        props.expense_type === "maps" ? undefined : props.expense_type,
      phase: props.phase === "initial" ? undefined : props.phase,
      currency: props.currency ?? undefined,
      contractor_id: props.contractor_id || undefined,
      expense_ref_id: props.expense_ref_id || undefined,
      vendor_id: props.vendor_id || undefined,
    },
  });

  const selectedType = watch("expense_type");

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!submitError) return;
    const t = setTimeout(() => setSubmitError(null), 5000);
    return () => clearTimeout(t);
  }, [submitError]);

  const onSubmit = async (data: UpdateProjectExpenseValues) => {
    try {
      setSubmitError(null);

      // ✅ (اختياري) تأكيد: لو نوع المصروف labor نحذف expense_ref_id والعكس
      const payload: UpdateProjectExpenseValues = {
        ...data,
        contractor_id:
          data.expense_type === "labor" ? data.contractor_id : null,
        expense_ref_id:
          data.expense_type === "material" ? data.expense_ref_id : null,
      };

      const { error } = await updateExpense(payload);

      if (error) {
        setSubmitError("حدث خطأ أثناء تعديل المصروف");
        return;
      }

      setSuccess("تم تعديل المصروف بنجاح!");
      window.location.reload();

      // keep form synced with latest submitted values
      reset(payload);
    } catch (e) {
      console.error("Submit error:", e);
      setSubmitError("حدث خطأ أثناء تعديل المصروف");
    }
  };

  return (
    <div className="text-sm">
      {success && (
        <div className="mb-3 p-2 rounded text-xs bg-success/10 text-success">
          {success}
        </div>
      )}
      {submitError && (
        <div className="mb-3 p-2 rounded text-xs bg-error/10 text-error">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* المصروف */}
          <SearchableSelectField
            id="expense_ref_id"
            label="المصروف"
            value={watch("expense_ref_id") ?? undefined}
            onChange={(value) => {
              setValue("expense_ref_id", value);
              const selected = expenses.find((e) => e.id === value);
              setValue("description", selected ? selected.name : "");
            }}
            loading={expensesLoading}
            options={expenses
              .sort((a, b) =>
                a.name.localeCompare(b.name, "ar", { sensitivity: "base" }),
              )
              .map((expense) => ({
                value: expense.id,
                label: expense.name,
              }))}
            placeholder={
              expensesError ? "فشل تحميل المصروفات" : "اختار المصروف"
            }
            error={errors.expense_ref_id}
          />

          {/* نوع المصروف */}
          <SelectField
            id="expense_type"
            label="نوع المصروف"
            register={register("expense_type")}
            error={errors.expense_type}
            options={[
              { value: "labor", label: "اعمال" },
              { value: "material", label: "مواد" },
            ]}
            placeholder="اختار نوع المصروف"
          />

          {selectedType === "labor" && (
            <SearchableSelectField
              id="contractor_id"
              label="المقاول"
              value={watch("contractor_id") || undefined}
              onChange={(value) => setValue("contractor_id", value)}
              error={errors.contractor_id}
              loading={contractorsLoading}
              options={contractors
                .sort((a, b) => {
                  const an = `${a.first_name} ${a.last_name || ""}`.trim();
                  const bn = `${b.first_name} ${b.last_name || ""}`.trim();
                  return an.localeCompare(bn, "ar", { sensitivity: "base" });
                })
                .map((c) => ({
                  value: c.id,
                  label: `${c.first_name} ${c.last_name || ""}`.trim(),
                }))}
              placeholder={
                contractorsError ? "فشل تحميل المقاولين" : "اختار المقاول"
              }
            />
          )}
          {selectedType === "material" && (
            <SearchableSelectField
              id="vendor_id"
              label="المورد"
              value={watch("vendor_id") || undefined}
              onChange={(value) => setValue("vendor_id", value)}
              error={errors.vendor_id}
              loading={vendorsLoading}
              options={vendors
                .sort((a, b) =>
                  a.vendor_name.localeCompare(b.vendor_name, "ar", {
                    sensitivity: "base",
                  }),
                )
                .map((v) => ({
                  value: v.id,
                  label: v.vendor_name,
                }))}
              placeholder={vendorsError ? "فشل تحميل الموردين" : "اختار المورد"}
            />
          )}

          {/* المرحلة */}
          <SelectField
            id="phase"
            label="المرحلة"
            register={register("phase")}
            error={errors.phase}
            options={[
              { value: "construction", label: "انشاء" },
              { value: "finishing", label: "تشطيب" },
            ]}
            placeholder="اختار المرحلة"
          />

          {/* إجمالي القيمة */}
          <NumberField
            id="total_amount"
            label="اجمالي القيمة"
            register={register("total_amount", { valueAsNumber: true })}
            error={errors.total_amount}
          />

          {/* التاريخ */}
          <DateField
            id="expense_date"
            label="التاريخ"
            register={register("expense_date")}
            error={errors.expense_date}
          />

          {/* العملة */}
          <SelectField
            id="currency"
            label="العملة"
            register={register("currency")}
            error={errors.currency}
            options={[
              { value: "LYD", label: "دينار ليبي" },
              { value: "USD", label: "دولار أمريكي" },
              { value: "EUR", label: "يورو" },
            ]}
            placeholder="اختار العملة"
          />

          {/* زر الحفظ */}
          <div className="flex justify-end items-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التعديل"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectExpenseEditForm;
