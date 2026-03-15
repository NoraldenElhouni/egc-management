import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";

// UI Components
import { NumberField } from "../../ui/inputs/NumberField";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";
import { TextField } from "../../ui/inputs/TextField"; // Assuming you have a standard text input

/** * 1. Define the Schema locally or import from your schema file
 * matches the CompanyExpense type
 */
const CompanyExpenseSchema = z.object({
  company_id: z.string().min(1, "Company ID is required"),
  amount: z.number().min(0.01, "المبلغ يجب ان يكون اكبر من 0"),
  type: z.string().min(1, "اختار نوع المصروف"),
  description: z.string().nullable().optional(),
  expense_date: z.string(),
  reference_id: z.string().nullable().optional(),
});

type CompanyExpenseFormValues = z.infer<typeof CompanyExpenseSchema>;

interface CompanyFinanceFormProps {
  companyId: string;
}

const CompanyFinanceForm = ({ companyId }: CompanyFinanceFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyExpenseFormValues>({
    resolver: zodResolver(CompanyExpenseSchema),
    defaultValues: {
      company_id: companyId,
      expense_date: new Date().toISOString().split("T")[0],
      amount: 0,
      type: "general",
    },
  });

  // Timers for alerts
  useEffect(() => {
    if (success || submitError) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setSubmitError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, submitError]);

  const onSubmit = async (data: CompanyExpenseFormValues) => {
    try {
      setSubmitError(null);
      console.log("data", data);

      setSuccess("تم إضافة مصروف الشركة بنجاح!");
      reset({
        company_id: companyId,
        expense_date: new Date().toISOString().split("T")[0],
      });

      // Optional: Refresh data or redirect
      // window.location.reload();
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="text-sm p-4">
      <h3 className="text-lg font-bold mb-4">تسجيل مصروفات الشركة</h3>

      {success && (
        <div className="mb-3 p-2 rounded text-xs bg-green-100 text-green-700">
          {success}
        </div>
      )}
      {submitError && (
        <div className="mb-3 p-2 rounded text-xs bg-red-100 text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Description (Span 2 columns) */}
          <TextField
            id="description"
            label="الوصف / البيان"
            register={register("description")}
            error={errors.description}
            placeholder="اكتب تفاصيل المصروف هنا..."
          />
          <TextField
            id="reference_id"
            label="رقم المرجع (إن وجد)"
            register={register("reference_id")}
            error={errors.reference_id}
            placeholder="مثال: رقم الفاتورة"
          />
          {/* Amount Field */}
          <NumberField
            id="amount"
            label="المبلغ"
            step={0.25}
            register={register("amount", { valueAsNumber: true })}
            error={errors.amount}
          />

          {/* Expense Type */}
          <SelectField
            id="type"
            label="نوع المصروف"
            register={register("type")}
            error={errors.type}
            options={[
              { value: "rent", label: "إيجار" },
              { value: "salaries", label: "رواتب" },
              { value: "utilities", label: "فواتير (كهرباء/ماء)" },
              { value: "marketing", label: "تسويق" },
              { value: "general", label: "عام" },
            ]}
            placeholder="اختار النوع"
          />

          {/* Date Field */}
          <DateField
            id="expense_date"
            label="تاريخ المصروف"
            register={register("expense_date")}
            error={errors.expense_date}
          />

          {/* Reference ID (Optional) */}

          <div className="flex justify-end items-end">
            <Button
              type="submit"
              className="w-full lg:w-auto"
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ المصروف"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanyFinanceForm;
