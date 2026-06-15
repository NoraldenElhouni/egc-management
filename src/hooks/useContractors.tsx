import { useEffect, useState } from "react";
import { Contractors } from "../types/global.type";
import { supabase } from "../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

export interface ContractorWithSpecialization {
  created_at: string;
  email: string | null;
  first_name: string;
  id: string;
  last_name: string | null;
  phone_number: string | null;
  updated_at: string;
  user_id: string | null;
  users: {
    user_specializations: {
      specialization_id: string;
      specializations: {
        id: string;
        name: string;
        role_id: string;
      };
    }[];
  } | null;
}

export function useContractors() {
  const [contractors, setContractors] = useState<
    ContractorWithSpecialization[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContractors() {
      setLoading(true);
      const { data, error } = await supabase.from("contractors").select(`
        *,
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
