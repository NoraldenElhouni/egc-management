// hooks/useSpecializations.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Specialization = { id: string; name: string };

export function useSpecializations() {
  const [data, setData] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSpecializations() {
      setLoading(true);
      const { data, error } = await supabase
        .from("specialities")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("error fetching specialities", error);
        setError(error);
      } else {
        setData(data ?? []);
      }
      setLoading(false);
    }

    fetchSpecializations();
  }, []);

  return { data, loading, error };
}

