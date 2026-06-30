// hooks/shop/categories/useCategories.ts
import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Categories } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";
import { ShopCategoryFormValues } from "../../../types/schema/shop/category.schema";

export function useCategories() {
  const [categories, setCategories] = useState<Categories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_categories")
          .select("*");

        if (fetchError) {
          console.error("Error fetching shop categories:", fetchError);
          setError(fetchError);
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error("Unexpected error fetching shop categories:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const addCategory = async (category: ShopCategoryFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("shop_categories")
        .insert([category])
        .select()
        .single();

      if (insertError) {
        console.error("Error adding shop category:", insertError);
        setError(insertError);
        return null;
      }

      setCategories((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Unexpected error adding shop category:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryActive = useCallback(
    async (id: string, isActive: boolean) => {
      setError(null);

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)),
      );

      try {
        const { data, error: updateError } = await supabase
          .from("shop_categories")
          .update({ is_active: isActive })
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          console.error("Error toggling category status:", updateError);
          setError(updateError);
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)),
          );
          return null;
        }

        return data;
      } catch (err) {
        console.error("Unexpected error toggling category status:", err);
        setError(err as PostgrestError);
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)),
        );
        return null;
      }
    },
    [],
  );

  return {
    categories,
    loading,
    error,
    addCategory,
    toggleCategoryActive,
  };
}
