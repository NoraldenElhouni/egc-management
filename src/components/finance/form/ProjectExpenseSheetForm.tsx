// ProjectExpenseBulkForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  ProjectExpenseFormValues,
  ProjectExpenseSchema,
} from "../../../types/schema/ProjectBook.schema";
import { useEffect, useState } from "react";
import { useContractors } from "../../../hooks/useContractors";
import { NumberField } from "../../ui/inputs/NumberField";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { DateField } from "../../ui/inputs/DateField";
import { useVendors } from "../../../hooks/useVendors";
import { useExpenses } from "../../../hooks/settings/useExpenses";
import { useBookProject } from "../../../hooks/projects/useBookProjects";

// Schema for bulk expenses
const BulkExpenseSchema = z.object({
  expenses: z
    .array(ProjectExpenseSchema)
    .min(1, "يجب إضافة مصروف واحد على الأقل"),
});

type BulkExpenseFormValues = {
  expenses: ProjectExpenseFormValues[];
};

interface ProjectExpenseBulkFormProps {
  projectId: string;
}

const ProjectExpenseBulkForm = ({ projectId }: ProjectExpenseBulkFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();

  const { addExpense } = useBookProject(projectId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(BulkExpenseSchema),
    defaultValues: {
      expenses: [
        {
          project_id: projectId,
          date: new Date().toISOString().split("T")[0],
          type: "material" as const,
          currency: "LYD" as const,
          payment_method: "cash" as const,
          phase: "construction" as const,
          description: "",
          total_amount: 0,
          paid_amount: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
  });

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  const onSubmit = async (data: BulkExpenseFormValues) => {
    try {
      setSubmitError(null);
      let successCount = 0;
      let errorCount = 0;

      // Submit each expense
      for (const expense of data.expenses) {
        const { error } = await addExpense(expense);
        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        setSubmitError(
          `تم إضافة ${successCount} مصروف بنجاح، فشل ${errorCount} مصروف`
        );
      } else {
        setSuccess(`تم إضافة ${successCount} مصروف بنجاح!`);
        reset({
          expenses: [
            {
              project_id: projectId,
              date: new Date().toISOString().split("T")[0],
              type: "material" as const,
              currency: "LYD" as const,
              payment_method: "cash" as const,
              phase: "construction" as const,
              description: "",
              total_amount: 0,
              paid_amount: 0,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("حدث خطأ أثناء إضافة المصروفات");
    }
  };

  const addNewRow = () => {
    append({
      project_id: projectId,
      date: new Date().toISOString().split("T")[0],
      type: "material" as const,
      currency: "LYD" as const,
      payment_method: "cash" as const,
      phase: "construction" as const,
      description: "",
      total_amount: 0,
      paid_amount: 0,
    });
  };

  const duplicateRow = (index: number) => {
    const rowData = watch(`expenses.${index}`);
    append({ ...rowData });
  };

  // Calculate totals
  const calculateTotals = () => {
    return fields.reduce(
      (acc, _, index) => {
        const total = watch(`expenses.${index}.total_amount`) || 0;
        const paid = watch(`expenses.${index}.paid_amount`) || 0;
        return {
          totalAmount: acc.totalAmount + total,
          paidAmount: acc.paidAmount + paid,
          remainingAmount: acc.remainingAmount + (total - paid),
        };
      },
      { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="text-sm">
      {/* Alert Messages */}
      <div className="space-y-2 mb-4">
        {success && (
          <div className="p-3 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}
        {submitError && (
          <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{submitError}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                المصروفات
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {fields.length} {fields.length === 1 ? "صف" : "صفوف"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addNewRow}
          >
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة صف جديد
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="min-w-[1900px]">
            {/* Table Header */}
            <div className="sticky top-0 z-10 grid grid-cols-[50px_200px_130px_180px_130px_140px_140px_140px_130px_100px_110px] gap-2 bg-gray-50 dark:bg-gray-700 px-4 py-3 font-semibold text-xs text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
              <div className="text-center">#</div>
              <div>المصروف</div>
              <div>النوع</div>
              <div>المقاول/المورد</div>
              <div>المرحلة</div>
              <div className="text-right">اجمالي القيمة</div>
              <div className="text-right">القيمة المدفوعة</div>
              <div>طريقة الدفع</div>
              <div>التاريخ</div>
              <div>العملة</div>
              <div className="text-center">إجراءات</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {fields.map((field, index) => {
                const selectedType = watch(`expenses.${index}.type`);
                const totalAmount =
                  watch(`expenses.${index}.total_amount`) || 0;
                const paidAmount = watch(`expenses.${index}.paid_amount`) || 0;
                const remainingAmount = totalAmount - paidAmount;
                const hasError = errors.expenses?.[index];

                return (
                  <div
                    key={field.id}
                    className={`grid grid-cols-[50px_200px_130px_180px_130px_140px_140px_140px_130px_100px_110px] gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      hasError ? "bg-red-50 dark:bg-red-900/10" : ""
                    }`}
                  >
                    {/* Row Number */}
                    <div className="flex items-center justify-center">
                      <span
                        className={`flex items-center justify-center w-7 h-7 text-xs font-medium rounded ${
                          hasError
                            ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
                            : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Expense */}
                    <div>
                      <SearchableSelectField
                        id={`expenses.${index}.expense_id`}
                        value={watch(`expenses.${index}.expense_id`)}
                        onChange={(value) => {
                          setValue(`expenses.${index}.expense_id`, value);
                          const selected = expenses.find((e) => e.id === value);
                          setValue(
                            `expenses.${index}.description`,
                            selected ? selected.name : ""
                          );
                        }}
                        loading={expensesLoading}
                        options={expenses
                          .sort((a, b) =>
                            a.name.localeCompare(b.name, "ar", {
                              sensitivity: "base",
                            })
                          )
                          .map((expense) => ({
                            value: expense.id,
                            label: expense.name,
                          }))}
                        placeholder={
                          expensesError ? "فشل التحميل" : "اختار المصروف"
                        }
                        error={errors.expenses?.[index]?.expense_id}
                        hideLabel
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <SelectField
                        id={`expenses.${index}.type`}
                        register={register(`expenses.${index}.type`)}
                        error={errors.expenses?.[index]?.type}
                        options={[
                          { value: "labor", label: "اعمال" },
                          { value: "material", label: "مواد" },
                        ]}
                        placeholder="النوع"
                        hideLabel
                      />
                    </div>

                    {/* Contractor/Vendor */}
                    <div>
                      {selectedType === "labor" ? (
                        <SearchableSelectField
                          id={`expenses.${index}.contractor_id`}
                          value={watch(`expenses.${index}.contractor_id`)}
                          onChange={(value) =>
                            setValue(`expenses.${index}.contractor_id`, value)
                          }
                          error={errors.expenses?.[index]?.contractor_id}
                          loading={contractorsLoading}
                          options={contractors
                            .sort((a, b) => {
                              const an = `${a.first_name} ${
                                a.last_name || ""
                              }`.trim();
                              const bn = `${b.first_name} ${
                                b.last_name || ""
                              }`.trim();
                              return an.localeCompare(bn, "ar", {
                                sensitivity: "base",
                              });
                            })
                            .map((c) => ({
                              value: c.id,
                              label:
                                `${c.first_name} ${c.last_name || ""}`.trim(),
                            }))}
                          placeholder={
                            contractorsError ? "فشل التحميل" : "المقاول"
                          }
                          hideLabel
                        />
                      ) : (
                        <SearchableSelectField
                          id={`expenses.${index}.vendor_id`}
                          value={watch(`expenses.${index}.vendor_id`)}
                          onChange={(value) =>
                            setValue(`expenses.${index}.vendor_id`, value)
                          }
                          error={errors.expenses?.[index]?.vendor_id}
                          loading={vendorsLoading}
                          options={vendors
                            .sort((a, b) =>
                              a.vendor_name.localeCompare(b.vendor_name, "ar", {
                                sensitivity: "base",
                              })
                            )
                            .map((v) => ({
                              value: v.id,
                              label: v.vendor_name,
                            }))}
                          placeholder={vendorsError ? "فشل التحميل" : "المورد"}
                          hideLabel
                        />
                      )}
                    </div>

                    {/* Phase */}
                    <div>
                      <SelectField
                        id={`expenses.${index}.phase`}
                        register={register(`expenses.${index}.phase`)}
                        error={errors.expenses?.[index]?.phase}
                        options={[
                          { value: "construction", label: "انشاء" },
                          { value: "finishing", label: "تشطيب" },
                        ]}
                        placeholder="المرحلة"
                        hideLabel
                      />
                    </div>

                    {/* Total Amount */}
                    <div className="relative">
                      <NumberField
                        id={`expenses.${index}.total_amount`}
                        register={register(`expenses.${index}.total_amount`, {
                          valueAsNumber: true,
                        })}
                        error={errors.expenses?.[index]?.total_amount}
                        placeholder="0.00"
                        hideLabel
                      />
                    </div>

                    {/* Paid Amount with indicator */}
                    <div className="relative">
                      <NumberField
                        id={`expenses.${index}.paid_amount`}
                        register={register(`expenses.${index}.paid_amount`, {
                          valueAsNumber: true,
                        })}
                        error={errors.expenses?.[index]?.paid_amount}
                        placeholder="0.00"
                        hideLabel
                      />
                      {totalAmount > 0 && (
                        <div className="absolute -bottom-5 right-0 text-[10px] whitespace-nowrap">
                          {remainingAmount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              متبقي: {remainingAmount.toFixed(2)}
                            </span>
                          ) : paidAmount > totalAmount ? (
                            <span className="text-red-600 dark:text-red-400">
                              زيادة: {Math.abs(remainingAmount).toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <SelectField
                        id={`expenses.${index}.payment_method`}
                        register={register(`expenses.${index}.payment_method`)}
                        error={errors.expenses?.[index]?.payment_method}
                        options={[
                          { value: "cash", label: "نقداً" },
                          { value: "bank", label: "بنك" },
                        ]}
                        placeholder="الطريقة"
                        hideLabel
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <DateField
                        id={`expenses.${index}.date`}
                        register={register(`expenses.${index}.date`)}
                        error={errors.expenses?.[index]?.date}
                        hideLabel
                      />
                    </div>

                    {/* Currency */}
                    <div>
                      <SelectField
                        id={`expenses.${index}.currency`}
                        register={register(`expenses.${index}.currency`)}
                        error={errors.expenses?.[index]?.currency}
                        options={[
                          { value: "LYD", label: "LYD" },
                          { value: "USD", label: "USD" },
                          { value: "EUR", label: "EUR" },
                        ]}
                        placeholder="العملة"
                        hideLabel
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRow(index)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="نسخ"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="حذف"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Footer */}
            {fields.length > 0 && (
              <div className="grid grid-cols-[50px_200px_130px_180px_130px_140px_140px_140px_130px_100px_110px] gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-500 font-semibold text-sm">
                <div className="col-span-5 text-right flex items-center justify-end">
                  الإجمالي:
                </div>
                <div className="text-right text-blue-700 dark:text-blue-300">
                  {totals.totalAmount.toFixed(2)}
                </div>
                <div className="text-right text-emerald-700 dark:text-emerald-300">
                  {totals.paidAmount.toFixed(2)}
                </div>
                <div className="col-span-4 text-left flex items-center">
                  <span
                    className={`${
                      totals.remainingAmount > 0
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    المتبقي: {totals.remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Errors */}
        {errors.expenses && (
          <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            {errors.expenses.root?.message || "يرجى تصحيح الأخطاء في الصفوف"}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 gap-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addNewRow}
          >
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة صف جديد
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {fields.length} {fields.length === 1 ? "صف" : "صفوف"} • الإجمالي:{" "}
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {totals.totalAmount.toFixed(2)}
              </span>
            </div>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg
                    className="w-4 h-4 ml-2 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  حفظ جميع المصروفات
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectExpenseBulkForm;
