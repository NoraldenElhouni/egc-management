// hooks/useMaps.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { MapType } from "../types/global.type";

function normalizeError(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e || fallback;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m || fallback;
  }
  return fallback;
}

export function useMaps() {
  const [maps, setMaps] = useState<MapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const { data, error } = await supabase
        .from("map_types")
        .select("id,name,created_at")
        .order("name", { ascending: false });

      if (error) throw error;
      setMaps((data ?? []) as MapType[]);
    } catch (e: unknown) {
      const msg = normalizeError(e, "فشل في تحميل أنواع الخرائط");
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const refetch = useCallback(async () => {
    await fetchMaps();
  }, [fetchMaps]);

  const addNew = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("الاسم مطلوب");

    try {
      setError(null);

      const { data, error } = await supabase
        .from("map_types")
        .insert([{ name: trimmed }])
        .select("id,name,created_at")
        .single();

      if (error) throw error;

      const row = data as MapType;

      setMaps((prev) => [row, ...prev]);
      return row;
    } catch (e: unknown) {
      const msg = normalizeError(e, "فشل في إضافة نوع خريطة");
      setError({ message: msg });
      throw new Error(msg);
    }
  }, []);

  const edit = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("الاسم مطلوب");

    try {
      setError(null);

      const { error } = await supabase
        .from("map_types")
        .update({ name: trimmed })
        .eq("id", id);

      if (error) throw error;

      setMaps((prev) =>
        prev.map((m) => (m.id === id ? { ...m, name: trimmed } : m))
      );
    } catch (e: unknown) {
      const msg = normalizeError(e, "فشل في تعديل نوع الخريطة");
      setError({ message: msg });
      throw new Error(msg);
    }
  }, []);

  return useMemo(
    () => ({
      maps,
      loading,
      error,
      refetch,
      addNew,
      edit,
    }),
    [maps, loading, error, refetch, addNew, edit]
  );
}
