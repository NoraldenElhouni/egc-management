import { useEffect, useState } from "react";
import { Contractors } from "../types/global.type";
import { contractorWithSpecializations } from "../types/extended.type";
import { supabase } from "../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

export function useContractors() {
  const [contractors, setContractors] = useState<
    contractorWithSpecializations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      setLoading(true);
      const { data, error } = await supabase.from("contractors").select(`
        *,
        specializations (*),
        users (
          user_specializations (
            specialization_id,
            specializations (*)
          )
        )
      `);
      if (error) {
        console.error("error fetching contractors", error);
        setError(error);
      } else {
        setContractors(
          (data ?? []) as unknown as contractorWithSpecializations[],
        );
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
