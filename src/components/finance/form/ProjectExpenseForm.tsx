// ProjectExpenseForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  addExpense: (data: ProjectExpenseFormValues) => Promise<{
    data: ProjectExpenses | null;
    error: PostgrestError | null;
  }>;
}

const ProjectExpenseForm = ({
  projectId,
  addExpense,
}: ProjectExpenseFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(ProjectExpenseSchema),
    defaultValues: {
      project_id: projectId,
      date: new Date().toISOString().split("T")[0],
      type: "material",
    },
  });

  // const totalAmount = watch("total_amount");
  const selectedType = watch("type");

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

  const onSubmit = async (data: ProjectExpenseFormValues) => {
    try {
      setSubmitError(null);
      const { error } = await addExpense(data);

      if (error) {
        setSubmitError("حدث خطأ أثناء إضافة المصروف");
        return;
      }

      setSuccess("تم إضافة المصروف بنجاح!");
      reset({ project_id: projectId });
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("حدث خطأ أثناء إضافة المصروف");
    }
  };

  // const handleMarkAsFullyPaid = () => {
  //   if (totalAmount) {
  //     setValue("paid_amount", totalAmount);
  //   }
  // };

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
                a.name.localeCompare(b.name, "ar", { sensitivity: "base" })
              )
              .map((expense) => ({
                value: expense.id,
                label: expense.name,
              }))}
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
                  })
                )
                .map((v) => ({
                  value: v.id,
                  label: v.vendor_name,
                }))}
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

          {/* <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAsFullyPaid}
              disabled={!totalAmount || totalAmount <= 0}
            >
              دفع كامل
            </Button>
          </div> */}

          <div className="flex justify-end items-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "جاري الانشاء..." : "انشاء المصروف"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectExpenseForm;
