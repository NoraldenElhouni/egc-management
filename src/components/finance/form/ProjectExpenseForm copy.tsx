// ProjectExpenseForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../types/global.type";
import { useVendors } from "../../../hooks/useVendors";
import { useExpenses } from "../../../hooks/settings/useExpenses";

interface ProjectExpenseFormProps {
  projectId: string;

  // add mode
  addExpense?: (data: ProjectExpenseFormValues) => Promise<{
    data: ProjectExpenses | null;
    error: PostgrestError | null;
  }>;

  // edit mode
  editingExpense?: ProjectExpenses | null;
  onUpdate?: (
    data: ProjectExpenseFormValues,
  ) => Promise<{ success: boolean; error?: string | null }>;
  onCancelEdit?: () => void;
}

const ProjectExpenseForm = ({
  projectId,
  addExpense,
  editingExpense,
  onUpdate,
  onCancelEdit,
}: ProjectExpenseFormProps) => {
  const isEdit = !!editingExpense;

  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ProjectExpenseFormValues>({
    resolver: zodResolver(ProjectExpenseSchema),
    defaultValues: {
      project_id: projectId,
      date: new Date().toISOString().split("T")[0],
      type: "material",
      currency: "LYD",
      paid_amount: 0,
      payment_method: "cash",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (isEdit && editingExpense) {
      // fill values
      setValue("project_id", editingExpense.project_id || projectId);
      setValue(
        "date",
        new Date(editingExpense.expense_date).toISOString().split("T")[0],
      );
      setValue("type", editingExpense.expense_type as any);
      setValue("phase", editingExpense.phase as any);
      setValue("total_amount", Number(editingExpense.total_amount || 0));
      setValue("description", editingExpense.description || "");
      setValue("expense_id", (editingExpense as any).expense_id || "");
      setValue("contractor_id", editingExpense.contractor_id || "");
      setValue("vendor_id", (editingExpense as any).vendor_id || "");

      // IMPORTANT: لازم يكون عندك currency في expense table
      if ((editingExpense as any).currency) {
        setValue("currency", (editingExpense as any).currency);
      }
    }
  }, [isEdit, editingExpense, projectId, setValue]);

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

  const onSubmit = async (data: ProjectExpenseFormValues) => {
    try {
      setSubmitError(null);

      if (isEdit) {
        if (!onUpdate) {
          setSubmitError("onUpdate غير موجود");
          return;
        }
        const res = await onUpdate(data);
        if (!res.success) {
          setSubmitError(res.error || "حدث خطأ أثناء تعديل المصروف");
          return;
        }
        setSuccess("تم تعديل المصروف بنجاح!");
        return;
      }

      // add mode
      if (!addExpense) {
        setSubmitError("addExpense غير موجود");
        return;
      }

      const { error } = await addExpense(data);
      if (error) {
        setSubmitError("حدث خطأ أثناء إضافة المصروف");
        return;
      }

      setSuccess("تم إضافة المصروف بنجاح!");
      window.location.reload();
      reset({ project_id: projectId });
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        isEdit ? "حدث خطأ أثناء تعديل المصروف" : "حدث خطأ أثناء إضافة المصروف",
      );
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
          <SearchableSelectField
            id="expense_id"
            label="المصروف"
            value={watch("expense_id")}
            onChange={(value) => {
              setValue("expense_id", value);
              const selected = expenses.find((e) => e.id === value);
              setValue("description", selected ? selected.name : "");
            }}
            loading={expensesLoading}
            options={expenses
              .sort((a, b) =>
                a.name.localeCompare(b.name, "ar", { sensitivity: "base" }),
              )
              .map((expense) => ({ value: expense.id, label: expense.name }))}
            placeholder={
              expensesError ? "فشل تحميل المصروفات" : "اختار المصروف"
            }
            error={errors.expense_id}
          />

          <SelectField
            id="type"
            label="نوع المصروف"
            register={register("type")}
            error={errors.type}
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
              value={watch("contractor_id")}
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
              value={watch("vendor_id")}
              onChange={(value) => setValue("vendor_id", value)}
              error={errors.vendor_id}
              loading={vendorsLoading}
              options={vendors
                .sort((a, b) =>
                  a.vendor_name.localeCompare(b.vendor_name, "ar", {
                    sensitivity: "base",
                  }),
                )
                .map((v) => ({ value: v.id, label: v.vendor_name }))}
              placeholder={vendorsError ? "فشل تحميل الموردين" : "اختار المورد"}
            />
          )}

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

          <NumberField
            id="total_amount"
            label="اجمالي القيمة"
            register={register("total_amount", { valueAsNumber: true })}
            error={errors.total_amount}
          />

          {/* ✅ paid_amount + payment_method فقط في add */}
          {!isEdit && (
            <>
              <NumberField
                id="paid_amount"
                label="القيمة مرادة الدفع"
                register={register("paid_amount", { valueAsNumber: true })}
                error={errors.paid_amount}
              />

              <SelectField
                id="payment_method"
                label="طريقة الدفع"
                register={register("payment_method")}
                error={errors.payment_method}
                options={[
                  { value: "cash", label: "نقداً" },
                  { value: "bank", label: "عن طريق البنك" },
                ]}
                placeholder="اختار طريقة الدفع"
              />
            </>
          )}

          <DateField
            id="date"
            label="التاريخ"
            register={register("date")}
            error={errors.date}
          />

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

          <div className="flex justify-end items-end gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? "جاري الحفظ..."
                : isEdit
                  ? "حفظ التعديل"
                  : "انشاء المصروف"}
            </Button>

            {isEdit && (
              <Button
                type="button"
                variant="primary-light"
                size="sm"
                onClick={() => {
                  onCancelEdit?.();
                  reset();
                }}
              >
                إلغاء
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectExpenseForm;
