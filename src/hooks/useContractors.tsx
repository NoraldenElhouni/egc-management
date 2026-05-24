import { useEffect, useState } from "react";
import { Contractors } from "../types/global.type";
import { supabase } from "../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/adminSupabase";

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
export function useContractorsNoUser() {
  const [contractors, setContractors] = useState<Contractors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .is("user_id", null);

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
