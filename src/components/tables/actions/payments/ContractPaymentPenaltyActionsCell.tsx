import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { supabase } from "../../../../lib/supabaseClient";
import Button from "../../../ui/Button";
import { ContractPaymentPenalty } from "../../../../types/contracts.type";

interface ContractPaymentPenaltyActionsCellProps {
  penalty: ContractPaymentPenalty;
  onRefresh?: () => void;
}

const ContractPaymentPenaltyActionsCell = ({
  penalty,
  onRefresh,
}: ContractPaymentPenaltyActionsCellProps) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const isPending = penalty.status === "pending";

  async function handleAccept() {
    if (!user?.id) return;
    setBusy("accept");
    try {
      const { error } = await supabase
        .schema("contracts")
        .from("payments_penalties")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", penalty.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error("Error approving penalty:", err);
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    setBusy("decline");
    try {
      const { error } = await supabase
        .schema("contracts")
        .from("payments_penalties")
        .update({ status: "declined" })
        .eq("id", penalty.id);
      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error("Error declining penalty:", err);
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

export default ContractPaymentPenaltyActionsCell;
