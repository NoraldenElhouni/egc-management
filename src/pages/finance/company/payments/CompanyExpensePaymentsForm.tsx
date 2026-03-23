import { useState } from "react";
import Button from "../../../../components/ui/Button";
import { NumberField } from "../../../../components/ui/inputs/NumberField";
import { SelectField } from "../../../../components/ui/inputs/SelectField";
import { DateField } from "../../../../components/ui/inputs/DateField"; // adjust if needed
import { useForm } from "react-hook-form";
import {
  CompanyExpensePaymentsSchema,
  CompanyExpensePaymentsValues,
} from "../../../../types/schema/companyFinance.schema";
import { zodResolver } from "@hookform/resolvers/zod";

interface CompanyExpensePaymentsFormProps {
  expense_id: string;
  remaining: number;
  onSubmit: (
    data: CompanyExpensePaymentsValues,
  ) => Promise<{ success: boolean; message?: string }>;
}

const CompanyExpensePaymentsForm = ({
  expense_id,
  remaining,
  onSubmit,
}: CompanyExpensePaymentsFormProps) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyExpensePaymentsValues>({
    resolver: zodResolver(CompanyExpensePaymentsSchema),
    defaultValues: {
      expense_id,
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleFormSubmit = async (data: CompanyExpensePaymentsValues) => {
    setSubmitting(true);
    const result = await onSubmit(data);
    setSubmitting(false);

    if (result.success) {
      reset({
        expense_id,
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
    } else {
      console.error("Payment failed:", result.message);
      // TODO: show toast/error UI
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <NumberField
            id="amount"
            label={`المبلغ (المتبقي: ${remaining})`}
            register={register("amount", { valueAsNumber: true })}
            error={errors.amount}
            min={0}
            max={remaining}
            step="0.01"
          />

          <SelectField
            id="payment_method"
            label="طريقة الدفع"
            register={register("payment_method")}
            error={errors.payment_method}
            options={[
              { value: "cash", label: "كاش" },
              { value: "bank", label: "بنك" },
            ]}
          />

          <DateField
            id="date"
            label="تاريخ الدفعة"
            register={register("date")}
            error={errors.date}
          />

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={submitting || remaining <= 0}
            >
              {submitting ? "جاري الحفظ..." : "إضافة الدفعة"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanyExpensePaymentsForm;
