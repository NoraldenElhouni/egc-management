// hooks/shop/divisions/useDivision.ts
// Single-record fetch + update by id, used by the show/edit parent
import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Divisions } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

export function useDivision(id: string) {
  const [division, setDivision] = useState<Divisions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchDivision() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_divisions")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching shop division:", fetchError);
          setError(fetchError);
          return;
        }

        setDivision(data);
      } catch (err) {
        console.error("Unexpected error fetching shop division:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchDivision();
  }, [id]);

  const updateDivision = async (
    updates: Partial<Omit<Divisions, "id" | "created_at">>,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("shop_divisions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating shop division:", updateError);
        setError(updateError);
        return null;
      }

      setDivision(data);
      return data;
    } catch (err) {
      console.error("Unexpected error updating shop division:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // hooks/shop/divisions/useDivision.ts
  // ... keep everything as-is, just add this function before the return

  const deleteDivision = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("shop_divisions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting shop division:", deleteError);
        setError(deleteError);
        return false;
      }

      setDivision(null);
      return true;
    } catch (err) {
      console.error("Unexpected error deleting shop division:", err);
      setError(err as PostgrestError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    division,
    loading,
    error,
    setDivision,
    updateDivision,
    deleteDivision,
  };
}
