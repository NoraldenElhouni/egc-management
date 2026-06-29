import { useEffect, useState } from "react";
import { Categories } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export function useCategories() {
  const [categories, setCategories] = useState<Categories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: categoriesError } = await supabase
          .from("shop_categories")
          .select("*");

        if (categoriesError) {
          console.error("Error fetching shop categories:", categoriesError);
          setError(categoriesError);
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

  return { categories, loading, error };
}
