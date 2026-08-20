import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { uploadFile } from "../../../lib/storage-client";
import { fetchByIds } from "./crossSchemaLookup";
import { PaymentMethod } from "../../../types/global.type";

export interface PaymentMilestoneRow {
  id: string;
  amount: number;
  milestone_id: string;
  milestones: { title: string } | null;
}

export interface PaymentPenaltyRow {
  id: string;
  amount: number;
  reason: string;
  description: string | null;
  image_path: string | null;
  milestone_id: string | null;
}

export interface RequestPaymentRow {
  id: string;
  project_id: string;
  contract_id: string;
  contractor_id: string;
  requested_by: string;
  amount: number;
  penalty_amount: number;
  grand_total: number | null;
  description: string | null;
  decline_reason: string | null;
  expense_id: string | null;
  payment_method: PaymentMethod | null;
  status: "pending" | "approved" | "rejected" | "paid";
  serial_number: number | null;
  paid_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  payment_milestones: PaymentMilestoneRow[];
  payment_penalties: PaymentPenaltyRow[];
  requester: { id: string; first_name: string; last_name: string | null } | null;
}

export function useContractPaymentLog(contractId: string) {
  const [payments, setPayments] = useState<RequestPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchPayments = async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("contracts")
        .from("request_payments")
        .select(
          `*,
          payment_milestones(id, amount, milestone_id, milestones(title)),
          payment_penalties(id, amount, reason, description, image_path, milestone_id)`,
        )
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      const employeesById = await fetchByIds<{
        id: string;
        first_name: string;
        last_name: string | null;
      }>(
        "employees",
        "id, first_name, last_name",
        (data ?? []).map((p) => p.requested_by),
      );

      setPayments(
        (data ?? []).map((p) => ({
          ...p,
          requester: employeesById[p.requested_by] ?? null,
        })),
      );
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [contractId]);

  return { payments, loading, error, refetch: fetchPayments };
}

export interface PaymentMilestoneInput {
  milestone_id: string;
  amount: number;
}

export interface PaymentPenaltyInput {
  milestone_id: string | null;
  amount: number;
  reason: string;
  description: string | null;
  image: File | null;
}

export function useCreateRequestPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  async function createRequestPayment(input: {
    project_id: string;
    contract_id: string;
    contractor_id: string;
    description: string | null;
    payment_method: PaymentMethod | null;
    milestones: PaymentMilestoneInput[];
    penalties: PaymentPenaltyInput[];
  }) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // `amount`/`penalty_amount`/`grand_total` are all DB-owned now:
    // amount/penalty_amount are kept in sync by triggers
    // (contracts.tg_sync_payment_amount / tg_sync_penalty_amount) once the
    // payment_milestones/payment_penalties rows below are inserted, and
    // grand_total is a generated column computed from them — the DB
    // rejects an explicit value for it. Nothing to set here; both settle
    // to the right values once the child rows land.
    const { data: payment, error: paymentError } = await supabase
      .schema("contracts")
      .from("request_payments")
      .insert({
        project_id: input.project_id,
        contract_id: input.contract_id,
        contractor_id: input.contractor_id,
        requested_by: user?.id ?? "",
        description: input.description,
        payment_method: input.payment_method,
        expense_id: null,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError) {
      setError(paymentError);
      setLoading(false);
      return { error: paymentError };
    }

    if (input.milestones.length > 0) {
      const { error: milestonesError } = await supabase
        .schema("contracts")
        .from("payment_milestones")
        .insert(
          input.milestones.map((m) => ({
            payment_id: payment.id,
            milestone_id: m.milestone_id,
            amount: m.amount,
          })),
        );

      if (milestonesError) {
        setError(milestonesError);
        setLoading(false);
        return { error: milestonesError };
      }
    }

    for (const penalty of input.penalties) {
      const { data: penaltyRow, error: penaltyError } = await supabase
        .schema("contracts")
        .from("payment_penalties")
        .insert({
          payment_id: payment.id,
          milestone_id: penalty.milestone_id,
          amount: penalty.amount,
          reason: penalty.reason,
          description: penalty.description,
          created_by: user?.id ?? "",
          image_path: null,
        })
        .select("id")
        .single();

      if (penaltyError) {
        setError(penaltyError);
        setLoading(false);
        return { error: penaltyError };
      }

      if (penalty.image) {
        try {
          const { path } = await uploadFile({
            file: penalty.image,
            entityType: "payment_penalty",
            entityId: penaltyRow.id,
          });

          await supabase
            .schema("contracts")
            .from("payment_penalties")
            .update({ image_path: path })
            .eq("id", penaltyRow.id);
        } catch (uploadError) {
          setError(uploadError as Error);
        }
      }
    }

    setLoading(false);
    return { error: null, paymentId: payment.id as string };
  }

  return { createRequestPayment, loading, error };
}
