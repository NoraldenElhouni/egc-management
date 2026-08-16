// hooks/useBanks.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bank } from "../types/global.type";
import { normalizeError } from "./useMaps";

const DUPLICATE_BANK_NAME_MESSAGE = "يوجد بنك بهذا الاسم بالفعل";

// Postgres unique_violation — the DB-level fallback in case the client-side
// pre-check races with another insert/update (name is now UNIQUE in the DB).
function isUniqueViolation(e: unknown) {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "23505"
  );
}

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const { data, error } = await supabase
        .schema("lookups")
        .from("banks")
        .select("id,name,created_at")
        .order("name", { ascending: false });

      if (error) throw error;
      setBanks((data ?? []) as Bank[]);
    } catch (e: unknown) {
      const msg = normalizeError(e, "فشل في تحميل البنوك");
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const refetch = useCallback(async () => {
    await fetchBanks();
  }, [fetchBanks]);

  const isDuplicateName = useCallback(
    (name: string, excludeId?: string) =>
      banks.some(
        (b) =>
          b.id !== excludeId &&
          b.name.trim().toLowerCase() === name.toLowerCase(),
      ),
    [banks],
  );

  const addNew = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("الاسم مطلوب");

      if (isDuplicateName(trimmed)) {
        setError({ message: DUPLICATE_BANK_NAME_MESSAGE });
        throw new Error(DUPLICATE_BANK_NAME_MESSAGE);
      }

      try {
        setError(null);

        const { data, error } = await supabase
          .schema("lookups")
          .from("banks")
          .insert([{ name: trimmed }])
          .select("id,name,created_at")
          .single();

        if (error) throw error;

        const row = data as Bank;

        setBanks((prev) => [row, ...prev]);
        return row;
      } catch (e: unknown) {
        const msg = isUniqueViolation(e)
          ? DUPLICATE_BANK_NAME_MESSAGE
          : normalizeError(e, "فشل في إضافة بنك");
        setError({ message: msg });
        throw new Error(msg);
      }
    },
    [isDuplicateName],
  );

  const edit = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("الاسم مطلوب");

      if (isDuplicateName(trimmed, id)) {
        setError({ message: DUPLICATE_BANK_NAME_MESSAGE });
        throw new Error(DUPLICATE_BANK_NAME_MESSAGE);
      }

      try {
        setError(null);

        const { error } = await supabase
          .schema("lookups")
          .from("banks")
          .update({ name: trimmed })
          .eq("id", id);

        if (error) throw error;

        setBanks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, name: trimmed } : b)),
        );
      } catch (e: unknown) {
        const msg = isUniqueViolation(e)
          ? DUPLICATE_BANK_NAME_MESSAGE
          : normalizeError(e, "فشل في تعديل البنك");
        setError({ message: msg });
        throw new Error(msg);
      }
    },
    [isDuplicateName],
  );

  const remove = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .schema("lookups")
        .from("banks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBanks((prev) => prev.filter((b) => b.id !== id));
    } catch (e: unknown) {
      const msg = normalizeError(e, "فشل في حذف البنك");
      setError({ message: msg });
      throw new Error(msg);
    }
  }, []);

  return useMemo(
    () => ({
      banks,
      loading,
      error,
      refetch,
      addNew,
      edit,
      remove,
    }),
    [banks, loading, error, refetch, addNew, edit, remove],
  );
}
