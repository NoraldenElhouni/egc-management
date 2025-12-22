import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import Button from "../../../ui/Button";
import { acceptPayrollPayment } from "../../../../services/payments/acceptPayroll";

interface AcceptPayrollPaymentsProps {
  payrollPaymentId: string;
}

const AcceptPayrollPayments = ({
  payrollPaymentId,
}: AcceptPayrollPaymentsProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const onSubmit = async () => {
    if (!user?.id) {
      alert("المستخدم غير مسجل");
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد أنك تريد قبول هذا الدفع؟ لا يمكن التراجع عن هذه العملية."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await acceptPayrollPayment(payrollPaymentId, user.id);

      if (result?.success) {
        alert("تم قبول الدفع بنجاح");
        window.location.reload(); // refresh page
      } else {
        alert(result?.error || "فشل في قبول الدفع");
      }
    } catch (error) {
      console.error("Error accepting payroll payment:", error);
      alert("حدث خطأ غير متوقع أثناء قبول الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="success" size="xs" disabled={loading} onClick={onSubmit}>
        {loading ? "جاري المعالجة..." : "قبول الدفع"}
      </Button>
    </div>
  );
};

export default AcceptPayrollPayments;
