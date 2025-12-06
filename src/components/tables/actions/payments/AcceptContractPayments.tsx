import { useState } from "react";
import Button from "../../../ui/Button";
import { useAuth } from "../../../../hooks/useAuth";
import { acceptContractPayment } from "../../../../services/payments/setPayments";

interface AcceptContractPaymentsProps {
  contractPaymentId: string;
  onSuccess?: () => void;
}

const AcceptContractPayments = ({
  contractPaymentId,
  onSuccess,
}: AcceptContractPaymentsProps) => {
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleChoose = async (method: "bank" | "cash") => {
    setChoosing(false);
    setLoading(true);
    try {
      if (!user?.id) {
        console.error("User not authenticated");
        alert("المستخدم غير مصدق. الرجاء تسجيل الدخول.");
        return;
      }

      const payment = await acceptContractPayment({
        approved_by: user.id,
        payment_id: contractPaymentId,
        payment_method: method,
        currency: "LYD",
      });

      if (payment.error) {
        console.error("Error accepting payment:", payment.error);
        // show the exact error message coming from the DB (will be Arabic from the function)
        const msg = payment.error;
        alert(msg);
      } else {
        // success — clear error and call onSuccess
        onSuccess?.();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        flexDirection: "column",
        alignSelf: "flex-start",
      }}
    >
      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <Button
          type="button"
          variant="success"
          size="xs"
          onClick={() => setChoosing((v) => !v)}
          loading={loading}
        >
          قبول الدفع
        </Button>
        {choosing && (
          <div
            style={{
              display: "inline-flex",
              gap: 6,
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "4px 6px",
            }}
          >
            <span style={{ fontSize: 12 }}>طريقة الدفع:</span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => handleChoose("bank")}
              loading={loading}
            >
              بنك
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => handleChoose("cash")}
              loading={loading}
            >
              نقدًا
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptContractPayments;
