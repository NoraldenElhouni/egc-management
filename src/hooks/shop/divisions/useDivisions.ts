import { useEffect, useState } from "react";
import { Divisions } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export function useDivisions() {
  const [divisions, setDivisions] = useState<Divisions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchDivisions() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rolesError } = await supabase
          .from("shop_divisions")
          .select("*");

        if (rolesError) {
          console.error("Error fetching shop divisions:", rolesError);
          setError(rolesError);
          return;
        }

        setDivisions(data || []);
      } catch (err) {
        console.error("Unexpected error fetching shop divisions:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchDivisions();
  }, []);

  return { divisions, loading, error };
}
