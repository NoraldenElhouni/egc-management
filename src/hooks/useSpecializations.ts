// hooks/useSpecializations.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Specialization = { id: string; name: string };

export function useSpecializations(role?: string) {
  const [data, setData] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSpecializations() {
      setLoading(true);

      if (role) {
        // role id
        const { data: roleData, error: roleError } = await supabase
          .from("roles")
          .select("*")
          .eq("name", role)
          .single();
        if (roleError || !roleData) {
          console.error("error fetching role", roleError);
          setError(roleError);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("specializations")
          .select("*")
          .eq("role_id", roleData.id);
        if (error) {
          console.error("error fetching specializations", error);
          setError(error);
        } else {
          setData(data ?? []);
        }
        setLoading(false);
      } else {
        const { data, error } = await supabase
          .from("specializations")
          .select("*");
        if (error) {
          console.error("error fetching specializations", error);
          setError(error);
        } else {
          setData(data ?? []);
        }
      }
    }

    fetchSpecializations();
  }, []);

  return { data, loading, error };
}
