import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { computeNextSortOrder } from "./sortOrder";

export interface Zone {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export function useZones(projectId: string) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchZones = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("boq")
        .from("zones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("error fetching zones", error);
        setError(error);
      } else {
        setZones(data ?? []);
      }
    } catch (err) {
      console.error("unexpected error fetching zones", err);
      setError(err as PostgrestError);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  return { zones, setZones, loading, error, refetch: fetchZones };
}

export function useCreateZone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createZone(
    projectId: string,
    values: { name: string },
    siblings: { sort_order: number }[],
  ) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .schema("boq")
      .from("zones")
      .insert({
        project_id: projectId,
        name: values.name,
        sort_order: computeNextSortOrder(siblings),
      })
      .select("*")
      .single();

    setLoading(false);
    if (error) {
      console.error("error creating zone", error);
      setError(error);
      return { data: null, error };
    }
    return { data, error: null };
  }

  return { createZone, loading, error };
}

export function useUpdateZone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateZone(zoneId: string, values: { name: string }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("zones")
      .update({ name: values.name })
      .eq("id", zoneId);

    setLoading(false);
    if (error) {
      console.error("error updating zone", error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { updateZone, loading, error };
}

const FOREIGN_KEY_VIOLATION = "23503";

export function useDeleteZone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function deleteZone(zoneId: string) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from("zones")
      .delete()
      .eq("id", zoneId);

    setLoading(false);
    if (error) {
      setError(error);
      if (error.code === FOREIGN_KEY_VIOLATION) {
        return {
          error,
          blocked: true as const,
          message: "هذه المنطقة مستخدمة في بنود قائمة، لا يمكن حذفها",
        };
      }
      return { error, blocked: false as const };
    }
    return { error: null, blocked: false as const };
  }

  return { deleteZone, loading, error };
}
