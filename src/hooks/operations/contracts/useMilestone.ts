// hooks/operations/contracts/useMilestone.ts
import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { fetchByIds } from "./crossSchemaLookup";

export interface MilestoneDetail {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  amount: number;
  percentage: number;
  due_date: string | null;
  status: "pending" | "in_progress" | "done";
  order_index: number;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  contracts: {
    id: string;
    total_amount: number;
    project_id: string;
    contractor_id: string;
    rounds: { title: string } | null;
    project: { name: string } | null;
    contractor: { first_name: string; last_name: string | null } | null;
  };
}

// Row shape of contracts.v_milestone_progress — not in the generated
// Database types since it's a plain view, hand-typed to match the SQL.
interface MilestoneProgressRow {
  milestone_id: string;
  contract_id: string;
  title: string;
  amount: number;
  status: string;
  claimed: number;
  paid: number;
  remaining: number;
}

const emptyProgress = { claimed: 0, paid: 0, remaining: 0 };

export function useMilestone(milestoneId: string) {
  const [milestone, setMilestone] = useState<MilestoneDetail | null>(null);
  const [progress, setProgress] = useState(emptyProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchMilestone = async () => {
    if (!milestoneId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("contracts")
        .from("milestones")
        .select(
          `*,
          contracts(
            id, total_amount, project_id, contractor_id,
            rounds(title)
          )`,
        )
        .eq("id", milestoneId)
        .single();

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      const row = data as unknown as {
        contracts: {
          id: string;
          total_amount: number;
          project_id: string;
          contractor_id: string;
          rounds: { title: string } | null;
        };
      } & Record<string, unknown>;

      const [projectsById, contractorsById, progressResult] =
        await Promise.all([
          fetchByIds<{ id: string; name: string }>("projects", "id, name", [
            row.contracts.project_id,
          ]),
          fetchByIds<{
            id: string;
            first_name: string;
            last_name: string | null;
          }>("contractors", "id, first_name, last_name", [
            row.contracts.contractor_id,
          ]),
          // v_milestone_progress is a plain view, not yet in the generated
          // Database types (added after the last `npm run types`).
          supabase
            .schema("contracts")
            .from("v_milestone_progress" as never)
            .select("claimed, paid, remaining")
            .eq("milestone_id", milestoneId)
            .maybeSingle(),
        ]);

      const progressRow = progressResult.data as Pick<
        MilestoneProgressRow,
        "claimed" | "paid" | "remaining"
      > | null;
      setProgress(progressRow ?? emptyProgress);

      setMilestone({
        ...row,
        contracts: {
          ...row.contracts,
          project: projectsById[row.contracts.project_id] ?? null,
          contractor: contractorsById[row.contracts.contractor_id] ?? null,
        },
      } as unknown as MilestoneDetail);
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestone();
  }, [milestoneId]);

  return {
    milestone,
    loading,
    error,
    refetch: fetchMilestone,
    // paid: status = 'paid' only — what to show as "paid so far".
    // remaining/claimed: mirrors contracts.tg_sync_payment_amount's guard
    // (claimed = every non-rejected payment) — use `remaining` for "how much
    // can a new payment request still claim against this milestone".
    paid: progress.paid,
    claimed: progress.claimed,
    remaining: progress.remaining,
  };
}

export function useCreateMilestone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createMilestone(input: {
    contract_id: string;
    title: string;
    description: string | null;
    amount: number;
    percentage: number;
    due_date: string | null;
    order_index: number;
  }) {
    setLoading(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .schema("contracts")
      .from("milestones")
      .insert({
        contract_id: input.contract_id,
        title: input.title,
        description: input.description,
        amount: input.amount,
        percentage: input.percentage,
        due_date: input.due_date,
        order_index: input.order_index,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError);
      return { error: insertError };
    }

    return { error: null, milestoneId: data.id };
  }

  return { createMilestone, loading, error };
}

export function useUpdateMilestoneDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateMilestoneDetails(
    milestoneId: string,
    input: { title: string; description: string | null; due_date: string | null },
  ) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .schema("contracts")
      .from("milestones")
      .update({
        title: input.title,
        description: input.description,
        due_date: input.due_date,
      })
      .eq("id", milestoneId);

    setLoading(false);

    if (updateError) {
      setError(updateError);
      return { error: updateError };
    }

    return { error: null };
  }

  return { updateMilestoneDetails, loading, error };
}
