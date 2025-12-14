import { useEffect, useState } from "react";
import { Contractors } from "../types/global.type";
import { supabase } from "../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

export function useContractors() {
  const [contractors, setContractors] = useState<Contractors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      setLoading(true);
      const { data, error } = await supabase.from("contractors").select("*");

      if (error) {
        console.error("error fetching contractors", error);
        setError(error);
      } else {
        setContractors(data ?? []);
      }

      setLoading(false);
    }

    fetchContractors();
  }, []); // runs once on mount

  return { contractors, loading, error };
}

export function useContractor(id: string) {
  const [contractor, setContractor] = useState<Contractors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractor() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setContractor(data ?? null);
      }

      setLoading(false);
    }

    fetchContractor();
  }, [id]); // runs once on mount}

  return { contractor, loading, error };
}
