// hooks/shop/categories/useCategory.ts
import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Categories, Subcategories } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

export function useCategory(id: string) {
  const [category, setCategory] = useState<Categories | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategories[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchCategory() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_categories")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching shop category:", fetchError);
          setError(fetchError);
          return;
        }

        const { data: subcategoriesData, error: subcategoriesError } =
          await supabase
            .from("shop_subcategories")
            .select("*")
            .eq("category_id", id);

        if (subcategoriesError) {
          console.error("Error fetching subcategories:", subcategoriesError);
          setError(subcategoriesError);
          return;
        }

        setCategory(data);
        setSubcategories(subcategoriesData);
      } catch (err) {
        console.error("Unexpected error fetching shop category:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [id]);

  const updateCategory = async (
    updates: Partial<Omit<Categories, "id" | "created_at">>,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("shop_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating shop category:", updateError);
        setError(updateError);
        return null;
      }

      setCategory(data);
      return data;
    } catch (err) {
      console.error("Unexpected error updating shop category:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("shop_categories")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting shop category:", deleteError);
        setError(deleteError);
        return false;
      }

      setCategory(null);
      return true;
    } catch (err) {
      console.error("Unexpected error deleting shop category:", err);
      setError(err as PostgrestError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    category,
    subcategories,
    loading,
    error,
    setCategory,
    updateCategory,
    deleteCategory,
  };
}
