import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NumberField } from "../../ui/inputs/NumberField";
import { SelectField } from "../../ui/inputs/SelectField";
import Button from "../../ui/Button";
import {
  ExpensePaymentFormValues,
  ExpensePaymentSchema,
} from "../../../types/schema/ProjectBook.schema";
import { Account, ProjectExpenses } from "../../../types/global.type";
import { useExpensePayments } from "../../../hooks/finance/usePayments";

interface ExpensePaymentsFormProps {
  expense: ProjectExpenses;
  accounts: Account[];
  remaining: number;
}

const ExpensePaymentsForm = ({
  expense,
  accounts,
  remaining,
}: ExpensePaymentsFormProps) => {
  const { submitting, addPayment } = useExpensePayments(expense.id);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExpensePaymentFormValues>({
    resolver: zodResolver(ExpensePaymentSchema(accounts, remaining)),
    defaultValues: {
      expenseId: expense.id,
      amount: 0,
      currency: "LYD",
      account_id: accounts.length > 0 ? accounts[0].id : "",
    },
  });

  const selectedCurrency = watch("currency");

  const accountOptions = accounts
    .filter((a) => a.currency === selectedCurrency)
    .map((a) => ({
      value: a.id,
      label: `${a.type === "bank" ? "بنك" : "نقدي"} - ${a.currency}`,
    }));

  useEffect(() => {
    // If current account doesn't match currency, clear it
    const currentAccountId = watch("account_id" as unknown as "account_id");
    const acc = accounts.find((a) => a.id === currentAccountId);
    if (acc && acc.currency !== selectedCurrency) setValue("account_id", "");
  }, [selectedCurrency, accounts, setValue, watch]);

  const onSubmit = async (vals: ExpensePaymentFormValues) => {
    setSubmitError(null);
    setSuccess(null);
    try {
      const { error } = await addPayment(vals);
      if (error) {
        setSubmitError("حدث خطأ أثناء إضافة المصروف");
        return;
      }
      setSuccess("تمت إضافة الدفعة بنجاح");
      reset();
    } catch (error) {
      setSubmitError("حدث خطأ غير متوقع أثناء إضافة المصروف");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">إضافة دفعة</h3>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <NumberField
            id="amount"
            label={`المبلغ (المتبقي: ${remaining.toFixed(2)})`}
            register={register("amount", { valueAsNumber: true })}
            error={errors.amount}
            min={0}
            step="1"
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
          />

          <SelectField
            id="account_id"
            label="الحساب"
            register={register("account_id")}
            error={errors.account_id}
            options={
              accountOptions.length
                ? accountOptions
                : [{ value: "", label: "لا توجد حسابات لهذه العملة" }]
            }
          />

          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={submitting || remaining <= 0}
            >
              {submitting ? "جاري الإضافة..." : "إضافة الدفعة"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExpensePaymentsForm;
