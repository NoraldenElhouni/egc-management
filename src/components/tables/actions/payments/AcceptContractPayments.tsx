import { useState } from "react";
import Button from "../../../ui/Button";
import { useAuth } from "../../../../hooks/useAuth";
import { supabase } from "../../../../lib/supabaseClient";

interface AcceptContractPaymentsProps {
  contractPaymentId: string;
}

const AcceptContractPayments = ({
  contractPaymentId,
}: AcceptContractPaymentsProps) => {
  const [choosing, setChoosing] = useState(false);
  const { user } = useAuth();

  const handleChoose = async (method: "bank" | "cash") => {
    setChoosing(false);
    console.log("accept payment", { id: contractPaymentId, method });

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
    }

    // TODO: integrate with payment acceptance API/action using selected method
  };
  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <Button
        type="button"
        variant="success"
        size="xs"
        onClick={() => setChoosing((v) => !v)}
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
          >
            بنك
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => handleChoose("cash")}
          >
            نقدًا
          </Button>
        </div>
      )}
    </div>
  );
};

export default AcceptContractPayments;
