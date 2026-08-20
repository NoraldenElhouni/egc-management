import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { RoundForm } from "../../../../types/schema/contracts.schema";
import { fetchByIds } from "../crossSchemaLookup";

export interface RoundListRow {
  id: string;
  project_id: string;
  title: string;
  notes: string | null;
  specialization_id: string | null;
  status: "draft" | "pricing" | "awarded" | "cancelled";
  created_by: string;
  created_at: string;
  quotes: { count: number }[];
  specialization: { name: string } | null;
}

export interface RoundItemRow {
  id: string;
  round_id: string;
  boq_item_id: string | null;
  work_id: string;
  name: string;
  unit: string;
  quantity: number;
  sort_order: number;
}

export interface RoundDetail {
  id: string;
  project_id: string;
  title: string;
  notes: string | null;
  specialization_id: string | null;
  status: "draft" | "pricing" | "awarded" | "cancelled";
  created_by: string;
  created_at: string;
  round_items: RoundItemRow[];
  specialization: { id: string; name: string } | null;
}

export function useRounds(projectId: string) {
  const [rounds, setRounds] = useState<RoundListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!projectId) return;
    async function fetchRounds() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema("contracts")
          .from("rounds")
          .select("*, quotes(count)")
          .eq("project_id", projectId);

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        const specsById = await fetchByIds<{ id: string; name: string }>(
          "specializations",
          "id, name",
          (data ?? []).map((r) => r.specialization_id),
        );

        setRounds(
          (data ?? []).map((r) => ({
            ...r,
            specialization: r.specialization_id
              ? (specsById[r.specialization_id] ?? null)
              : null,
          })),
        );
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchRounds();
  }, [projectId]);

  return { rounds, loading, error };
}

export function useRound(roundId: string) {
  const [round, setRound] = useState<RoundDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRound = async () => {
    if (!roundId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("contracts")
        .from("rounds")
        .select("*, round_items(*)")
        .eq("id", roundId)
        .order("sort_order", {
          referencedTable: "round_items",
          ascending: true,
        })
        .single();

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      const specsById = await fetchByIds<{ id: string; name: string }>(
        "specializations",
        "id, name",
        [data.specialization_id],
      );

      setRound({
        ...data,
        specialization: data.specialization_id
          ? (specsById[data.specialization_id] ?? null)
          : null,
      });
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRound();
  }, [roundId]);

  return { round, loading, error, refetch: fetchRound };
}

export interface RoundItemInput {
  work_id: string;
  boq_item_id: string | null;
  name: string;
  unit: string;
  quantity: number;
}

export function useCreateRound() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createRound(values: RoundForm, projectId: string) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: round, error: roundError } = await supabase
      .schema("contracts")
      .from("rounds")
      .insert({
        project_id: projectId,
        specialization_id: values.specialization_id ?? null,
        title: values.title,
        notes: values.notes ?? null,
        created_by: user?.id ?? "",
        status: "draft",
      })
      .select("id")
      .single();

    if (roundError) {
      setError(roundError);
      setLoading(false);
      return { error: roundError };
    }

    const { error: itemsError } = await supabase
      .schema("contracts")
      .from("round_items")
      .insert(
        values.items.map((item, index) => ({
          round_id: round.id,
          work_id: item.work_id,
          boq_item_id: item.boq_item_id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          sort_order: index,
        })),
      );

    if (itemsError) {
      setError(itemsError);
      setLoading(false);
      return { error: itemsError };
    }

    setLoading(false);
    return { error: null, roundId: round.id as string };
  }

  return { createRound, loading, error };
}

export function useEditRound() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function editRound(values: RoundForm, roundId: string) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .schema("contracts")
      .from("rounds")
      .update({
        specialization_id: values.specialization_id ?? null,
        title: values.title,
        notes: values.notes ?? null,
      })
      .eq("id", roundId);

    if (updateError) {
      setError(updateError);
      setLoading(false);
      return { error: updateError };
    }

    const { error: deleteError } = await supabase
      .schema("contracts")
      .from("round_items")
      .delete()
      .eq("round_id", roundId);

    if (deleteError) {
      setError(deleteError);
      setLoading(false);
      return { error: deleteError };
    }

    const { error: itemsError } = await supabase
      .schema("contracts")
      .from("round_items")
      .insert(
        values.items.map((item, index) => ({
          round_id: roundId,
          work_id: item.work_id,
          boq_item_id: item.boq_item_id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          sort_order: index,
        })),
      );

    if (itemsError) {
      setError(itemsError);
      setLoading(false);
      return { error: itemsError };
    }

    setLoading(false);
    return { error: null };
  }

  return { editRound, loading, error };
}

// Quotes are filled out internally by staff (contractor selected, prices
// entered by us) — rounds never notify contractors, so this only flips
// the status to unlock the "add quote" step.
export function useSendRoundToPricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function sendToPricing(roundId: string) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .schema("contracts")
      .from("rounds")
      .update({ status: "pricing" })
      .eq("id", roundId);

    setLoading(false);

    if (updateError) {
      setError(updateError);
      return { error: updateError };
    }

    return { error: null };
  }

  return { sendToPricing, loading, error };
}

export function useCancelRound() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function cancelRound(roundId: string) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .schema("contracts")
      .from("rounds")
      .update({ status: "cancelled" })
      .eq("id", roundId);

    setLoading(false);

    if (updateError) {
      setError(updateError);
      return { error: updateError };
    }

    return { error: null };
  }

  return { cancelRound, loading, error };
}
