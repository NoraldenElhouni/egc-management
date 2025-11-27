// ProjectExpenseForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ProjectExpenseFormValues,
  ProjectExpenseSchema,
} from "../../../types/schema/ProjectBook.schema";
import { useEffect, useState } from "react";
import { NumberField } from "../../ui/inputs/NumberField";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";

import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../types/global.type";

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
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    // watch,
    // setValue,
  } = useForm({
    resolver: zodResolver(ProjectExpenseSchema),
    defaultValues: {
      project_id: projectId,
      date: new Date().toISOString().split("T")[0],
    },
  });

  // const totalAmount = watch("total_amount");

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
          <TextField
            id="description"
            label="الوصف"
            register={register("description")}
            error={errors.description}
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
              { value: "bank_transfer", label: "تحويل بنكي" },
              { value: "check", label: "شيك" },
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
          <div />

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
