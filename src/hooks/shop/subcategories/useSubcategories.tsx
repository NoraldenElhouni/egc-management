import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Subcategories } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";
import { ShopSubcategoryFormValues } from "../../../types/schema/shop/subcategory.schema";

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<Subcategories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchSubcategories() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_subcategories")
          .select("*");

        if (fetchError) {
          console.error("Error fetching shop subcategories:", fetchError);
          setError(fetchError);
          return;
        }

        setSubcategories(data || []);
      } catch (err) {
        console.error("Unexpected error fetching shop subcategories:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchSubcategories();
  }, []);

  const addSubcategory = async (subcategory: ShopSubcategoryFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("shop_subcategories")
        .insert([subcategory])
        .select()
        .single();

      if (insertError) {
        console.error("Error adding shop subcategory:", insertError);
        setError(insertError);
        return null;
      }

      setSubcategories((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Unexpected error adding shop subcategory:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleSubcategoryActive = useCallback(
    async (id: string, isActive: boolean) => {
      setError(null);

      setSubcategories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
      );

      try {
        const { data, error: updateError } = await supabase
          .from("shop_subcategories")
          .update({ is_active: isActive })
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          console.error("Error toggling subcategory status:", updateError);
          setError(updateError);
          setSubcategories((prev) =>
            prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)),
          );
          return null;
        }

        return data;
      } catch (err) {
        console.error("Unexpected error toggling subcategory status:", err);
        setError(err as PostgrestError);
        setSubcategories((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)),
        );
        return null;
      }
    },
    [],
  );

  return {
    subcategories,
    loading,
    error,
    addSubcategory,
    toggleSubcategoryActive,
  };
}
