import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contractors } from "../types/global.type";
import { contractorWithSpecializations } from "../types/extended.type";
import { supabase } from "../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

const fetchContractors = async (): Promise<
  contractorWithSpecializations[]
> => {
  const { data, error } = await supabase
    .from("contractors")
    .select(
      `
      *,
      specializations (*),
      users!contractors_user_id_fkey (
        user_specializations (
          specialization_id,
          specializations (*)
        )
      )
    `,
    )
    .neq("status", "merged");

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as contractorWithSpecializations[];
};

export const useContractorsQuery = () =>
  useQuery({
    queryKey: ["contractors"],
    queryFn: fetchContractors,
  });

export function useContractors() {
  const [contractors, setContractors] = useState<
    contractorWithSpecializations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("contractors")
        .select(
          `
        *,
        specializations (*),
        users!contractors_user_id_fkey (
          user_specializations (
            specialization_id,
            specializations (*)
          )
        )
      `,
        )
        .neq("status", "merged");
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
        .is("user_id", null)
        .neq("status", "merged");

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
