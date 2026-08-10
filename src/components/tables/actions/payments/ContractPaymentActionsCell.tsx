import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { supabase } from "../../../../lib/supabaseClient";
import Button from "../../../ui/Button";
import { ContractPayment } from "../../../../types/contracts.type";

interface ContractPaymentActionsCellProps {
  payment: ContractPayment;
  onRefresh?: () => void;
}

const ContractPaymentActionsCell = ({
  payment,
  onRefresh,
}: ContractPaymentActionsCellProps) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const isPending = payment.status === "pending";

  async function handleAccept() {
    if (!user?.id) return;
    setBusy("accept");
    try {
      const { error } = await supabase
        .schema("contracts")
        .from("payments")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error("Error approving payment:", err);
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    setBusy("decline");
    try {
      const { error } = await supabase
        .schema("contracts")
        .from("payments")
        .update({ status: "declined" })
        .eq("id", payment.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error("Error declining payment:", err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="success"
        size="xs"
        disabled={!isPending}
        loading={busy === "accept"}
        onClick={handleAccept}
      >
        قبول
      </Button>
      <Button
        type="button"
        variant="error"
        size="xs"
        disabled={!isPending}
        loading={busy === "decline"}
        onClick={handleDecline}
      >
        رفض
      </Button>
    </div>
  );
};

export default ContractPaymentActionsCell;
