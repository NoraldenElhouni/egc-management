import { useEffect, useState } from "react";
import { useBookProject } from "../../../hooks/projects/useBookProjects";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectRefundSchema,
  ProjectRefundValues,
} from "../../../types/schema/ProjectBook.schema";
import { SelectField } from "../../ui/inputs/SelectField";
import { NumberField } from "../../ui/inputs/NumberField";
import { TextField } from "../../ui/inputs/TextField";
import { DateField } from "../../ui/inputs/DateField";
import Button from "../../ui/Button";

interface ProjectRefundFormProps {
  projectId: string;
}

const ProjectRefundForm = ({ projectId }: ProjectRefundFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { addRefund } = useBookProject(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectRefundValues>({
    resolver: zodResolver(projectRefundSchema),
    defaultValues: {
      project_id: projectId,
      income_date: new Date().toISOString().split("T")[0],
      currency: "LYD",
    },
  });

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

  const onSubmit = async (data: ProjectRefundValues) => {
    try {
      setSubmitError(null);
      const result = await addRefund(data);

      if (!result.success) {
        setSubmitError("error");
        return;
      }
      setSuccess("تم إضافة الدخل بنجاح!");
      reset({ project_id: projectId });
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("حدث خطأ أثناء إضافة الدخل");
    }
  };
  return (
    <div className="p-2 text-sm">
      {" "}
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <NumberField
            id="amount"
            label="القيمة"
            register={register("amount", { valueAsNumber: true })}
            error={errors.amount}
          />
          <TextField
            id="description"
            label="الوصف"
            register={register("description")}
            error={errors.description}
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
          />
          <DateField
            id="income_date"
            label="التاريخ"
            register={register("income_date")}
            error={errors.income_date}
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
            placeholder="اختر العملة"
          />

          <div className="flex justify-end items-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "إرسال الدخل"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectRefundForm;
