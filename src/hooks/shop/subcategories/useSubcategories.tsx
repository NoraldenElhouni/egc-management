import { useEffect, useState } from "react";
import { Subcategories } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<Subcategories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchSubcategories() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: subcategoriesError } = await supabase
          .from("shop_subcategories")
          .select("*");

        if (subcategoriesError) {
          console.error(
            "Error fetching shop subcategories:",
            subcategoriesError,
          );
          setError(subcategoriesError);
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

  return { subcategories, loading, error };
}
