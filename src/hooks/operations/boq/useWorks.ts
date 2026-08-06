import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { WorkFull } from "./types";

export interface Work {
  id: string;
  type_id: string;
  zone_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/**
 * Plain (non-hook) fetch for a single type's works + items, callable
 * on-demand outside of render (e.g. in parallel for several types/versions).
 */
export async function fetchWorksForType(typeId: string): Promise<WorkFull[]> {
  const { data, error } = await supabase
    .schema("boq")
    .from("works")
    .select(
      `id, type_id, zone_id, name, sort_order,
      items ( id, name, unit, quantity, unit_price, sort_order )`,
    )
    .eq("type_id", typeId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("error fetching works", error);
    throw error;
  }
  return (data ?? []) as unknown as WorkFull[];
}

export function useTypeWorks(typeId: string) {
  const [works, setWorks] = useState<WorkFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchWorks = useCallback(async () => {
    if (!typeId) return;
    setLoading(true);
    try {
      const data = await fetchWorksForType(typeId);
      setWorks(data);
      setError(null);
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [typeId]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return { works, loading, error, refetch: fetchWorks };
}

export function useCreateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createWork(
    typeId: string,
    zoneId: string,
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const nextSortOrder =
      Math.max(0, ...siblings.map((s) => s.sort_order)) + 1;

    const { data, error } = await supabase
      .schema("boq")
      .from("works")
      .insert({
        type_id: typeId,
        zone_id: zoneId,
        name: values.name,
        sort_order: nextSortOrder,
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating work", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createWork, loading, error };
}

export function useUpdateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateWork(workId: string, values: { name: string }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("works")
      .update({ name: values.name })
      .eq("id", workId);

    setLoading(false);
    if (error) {
      console.error("error updating work", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateWork, loading, error };
}

export function useDeleteWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteWork(work: WorkFull) {
    setLoading(true);
    setError(null);

    const itemIds = work.items.map((i) => i.id);

    if (itemIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("items")
        .delete()
        .in("id", itemIds);
      if (error) {
        setError(error);
        setLoading(false);
        return { error };
      }
    }

    const { error } = await supabase
      .schema("boq")
      .from("works")
      .delete()
      .eq("id", work.id);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteWork, loading, error };
}
