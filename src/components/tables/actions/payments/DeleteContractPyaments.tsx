import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import Button from "../../../ui/Button";

interface DeleteContractPaymentsProps {
  contractPaymentId: string;
  onSuccess?: () => void;
}

const DeleteContractPayments = ({
  contractPaymentId,
  onSuccess,
}: DeleteContractPaymentsProps) => {
  const [loading, setLoading] = useState(false);
  const rejectPaymets = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("contract_payments")
        .update({
          status: "rejected",
        })
        .eq("id", contractPaymentId);

      if (error) {
        console.error("Error rejecting payment:", error.message);
        alert("حدث خطأ أثناء رفض الدفع. الرجاء المحاولة مرة أخرى.");
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
    <Button
      type="button"
      variant="error"
      size="xs"
      loading={loading}
      onClick={rejectPaymets}
    >
      رفض
    </Button>
  );
};

export default DeleteContractPayments;
