import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Contracts } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

export function useContracts(projectId: string) {
  const [contracts, setContracts] = useState<Contracts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("project_id", projectId);

        if (error) {
          console.error("error fetching contracts", error);
          setError(error);
        } else {
          setContracts(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching contracts", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchContracts();
  }, []);

  return { contracts, loading, error };
}
