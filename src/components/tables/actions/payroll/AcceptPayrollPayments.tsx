import { useEffect, useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import Button from "../../../ui/Button";
import { acceptPayrollPayment } from "../../../../services/payments/acceptPayroll";
import Dialog from "../../../ui/Dialog";
import { formatCurrency } from "../../../../utils/helpper";

interface AcceptPayrollPaymentsProps {
  payrollPaymentId: string;
  totalAmount: number;
}

const AcceptPayrollPayments = ({
  payrollPaymentId,
  totalAmount,
}: AcceptPayrollPaymentsProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [cashAmount, setCashAmount] = useState(0);
  const [bankAmount, setBankAmount] = useState(totalAmount);

  const { user } = useAuth();

  // Keep bankAmount in sync when totalAmount prop changes
  useEffect(() => {
    setCashAmount(0);
    setBankAmount(totalAmount);
  }, [totalAmount]);

  // Independent handlers — no auto-sync, user controls both fields freely
  const handleCashAmountChange = (value: number) => setCashAmount(value);
  const handleBankAmountChange = (value: number) => setBankAmount(value);

  // Validate split amounts
  useEffect(() => {
    if (cashAmount + bankAmount !== totalAmount) {
      setValidationError(
        "يجب أن يكون مجموع الكاش والبنك مساوياً للمبلغ الإجمالي",
      );
    } else {
      setValidationError(null);
    }
  }, [cashAmount, bankAmount, totalAmount]);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const onSubmit = async () => {
    if (!user?.id) {
      setErrorMessage("المستخدم غير مسجل الدخول");
      return;
    }
    if (validationError) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await acceptPayrollPayment(
        payrollPaymentId,
        user.id,
        cashAmount,
        bankAmount,
      );

      if (result?.success) {
        setSuccessMessage("تم قبول الدفع بنجاح");
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1200);
      } else {
        setErrorMessage(result?.error || "فشل في قبول الدفع");
      }
    } catch (err) {
      console.error("Error accepting payroll payment:", err);
      setErrorMessage("حدث خطأ غير متوقع أثناء قبول الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="success"
        size="xs"
        loading={loading}
        onClick={() => setOpen(true)}
      >
        قبول الدفع
      </Button>

      <Dialog isOpen={open} onClose={handleClose}>
        <div className="space-y-4" dir="rtl">
          <h2 className="text-lg font-bold text-gray-800">تأكيد قبول الدفع</h2>

          {/* Total amount display */}
          <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-medium">المبلغ الإجمالي: </span>
            <span className="font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Cash / Bank split inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">كاش</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={cashAmount}
                disabled={loading}
                onChange={(e) => handleCashAmountChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">بنك</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={bankAmount}
                disabled={loading}
                onChange={(e) => handleBankAmountChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}

          {/* API error */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={onSubmit}
              loading={loading}
              disabled={!!validationError || loading || !!successMessage}
            >
              تأكيد قبول الدفع
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AcceptPayrollPayments;
