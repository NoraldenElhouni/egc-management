import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Subcategories } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

export function useSubcategory(id: string) {
  const [subcategory, setSubcategory] = useState<Subcategories | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchSubcategory() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_subcategories")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching shop subcategory:", fetchError);
          setError(fetchError);
          return;
        }

        setSubcategory(data);
      } catch (err) {
        console.error("Unexpected error fetching shop subcategory:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchSubcategory();
  }, [id]);

  const updateSubcategory = async (
    updates: Partial<Omit<Subcategories, "id" | "created_at">>,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("shop_subcategories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating shop subcategory:", updateError);
        setError(updateError);
        return null;
      }

      setSubcategory(data);
      return data;
    } catch (err) {
      console.error("Unexpected error updating shop subcategory:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubcategory = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("shop_subcategories")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting shop subcategory:", deleteError);
        setError(deleteError);
        return false;
      }

      setSubcategory(null);
      return true;
    } catch (err) {
      console.error("Unexpected error deleting shop subcategory:", err);
      setError(err as PostgrestError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    subcategory,
    loading,
    error,
    setSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
