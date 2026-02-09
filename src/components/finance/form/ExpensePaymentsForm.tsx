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
import { projectExpensePayments } from "../../../types/extended.type";

interface ExpensePaymentsFormProps {
  expense: ProjectExpenses;
  accounts: Account[];
  remaining: number;
  editingPayment?: projectExpensePayments | null;
  onCancelEdit?: () => void;
}

const ExpensePaymentsForm = ({
  expense,
  accounts,
  remaining,
  editingPayment,
  onCancelEdit,
}: ExpensePaymentsFormProps) => {
  const { submitting, addPayment, editPayment } = useExpensePayments(
    expense.id,
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const effectiveRemaining = editingPayment
    ? remaining + (editingPayment.amount ?? 0)
    : remaining;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExpensePaymentFormValues>({
    resolver: zodResolver(ExpensePaymentSchema(accounts, effectiveRemaining)),
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

  useEffect(() => {
    if (editingPayment) {
      setValue("amount", Number(editingPayment.amount ?? 0));
      setValue("currency", editingPayment.accounts?.currency ?? "LYD");
      setValue("account_id", editingPayment.account_id ?? "");
    }
  }, [editingPayment, setValue]);

  const onSubmit = async (vals: ExpensePaymentFormValues) => {
    setSubmitError(null);
    setSuccess(null);

    try {
      if (editingPayment?.id) {
        const res = await editPayment(editingPayment.id, vals);
        if (!res.success) {
          setSubmitError(res.error || "حدث خطأ أثناء تعديل الدفعة");
          return;
        }
        setSuccess("تم تعديل الدفعة بنجاح");
        onCancelEdit?.();
      } else {
        const res = await addPayment(vals);
        if (!res.success) {
          setSubmitError(res.error || "حدث خطأ أثناء إضافة الدفعة");
          return;
        }
        setSuccess("تمت إضافة الدفعة بنجاح");
      }

      reset();
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setSubmitError("حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {editingPayment ? "تعديل دفعة" : "إضافة دفعة"}
      </h3>

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
            step="0.01"
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

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={submitting}
            >
              {submitting
                ? "جاري الحفظ..."
                : editingPayment
                  ? "حفظ التعديل"
                  : "إضافة الدفعة"}
            </Button>

            {editingPayment && (
              <Button
                type="button"
                size="sm"
                variant="primary-light"
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

export default ExpensePaymentsForm;
