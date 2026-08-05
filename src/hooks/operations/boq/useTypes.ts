import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export interface BOQType {
  id: string;
  project_id: string;
  name: string;
  version: number;
  sort_order: number;
  created_at: string;
}

export function useTypes(projectId: string) {
  const [types, setTypes] = useState<BOQType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("types")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("error fetching types", error);
        setError(error);
      } else {
        setTypes(data ?? []);
      }
    } catch (err) {
      console.error("unexpected error fetching types", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { types, loading, error, refetch: fetchTypes };
}

export function useCreateType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createType(
    projectId: string,
    values: { name: string; version: number },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const nextSortOrder =
      Math.max(0, ...siblings.map((s) => s.sort_order)) + 1;

    const { data, error } = await supabase
      .schema("boq")
      .from("types")
      .insert({
        project_id: projectId,
        name: values.name,
        version: values.version,
        sort_order: nextSortOrder,
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating type", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createType, loading, error };
}

export function useUpdateType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateType(
    typeId: string,
    values: { name: string; version: number },
  ) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("types")
      .update({ name: values.name, version: values.version })
      .eq("id", typeId);

    setLoading(false);
    if (error) {
      console.error("error updating type", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateType, loading, error };
}

export function useDeleteType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteType(typeId: string) {
    setLoading(true);
    setError(null);

    const { data: works, error: fetchError } = await supabase
      .schema("boq")
      .from("works")
      .select("id, items ( id )")
      .eq("type_id", typeId);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return { error: fetchError };
    }

    const rows = works ?? [];
    const itemIds = rows.flatMap((w) => w.items.map((i) => i.id));
    const workIds = rows.map((w) => w.id);

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

    if (workIds.length > 0) {
      const { error } = await supabase
        .schema("boq")
        .from("works")
        .delete()
        .in("id", workIds);
      if (error) {
        setError(error);
        setLoading(false);
        return { error };
      }
    }

    const { error } = await supabase
      .schema("boq")
      .from("types")
      .delete()
      .eq("id", typeId);

    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { deleteType, loading, error };
}
