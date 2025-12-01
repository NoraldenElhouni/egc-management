import { useState } from "react";
import Button from "../../../ui/Button";
import { useAuth } from "../../../../hooks/useAuth";
import { supabase } from "../../../../lib/supabaseClient";

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
        return;
      }

      const { error } = await supabase.rpc("accept_contract_payment", {
        p_payment_id: contractPaymentId,
        p_approved_by: user.id,
        p_payment_method: method,
        p_currency: "LYD",
      });

      if (error) {
        console.error("Error accepting payment:", error.message);
        alert("حدث خطأ أثناء قبول الدفع. الرجاء المحاولة مرة أخرى.");
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  return (
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
  );
};

export default AcceptContractPayments;
