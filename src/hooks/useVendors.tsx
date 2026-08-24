import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vendor } from "../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { VendorsWithSpecializations } from "../types/extended.type";

const fetchVendorsList = async (): Promise<VendorsWithSpecializations[]> => {
  const { data, error } = await supabase
    .from("vendors")
    .select(
      `
      *,
      specializations (*),
      users!vendors_user_id_fkey (
        user_specializations (
          specialization_id,
          specializations (*)
        )
      )
    `,
    )
    .neq("status", "merged");

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as VendorsWithSpecializations[];
};

export const useVendorsQuery = () =>
  useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendorsList,
  });

export function useVendors() {
  const [vendors, setVendors] = useState<VendorsWithSpecializations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendors")
        .select(
          `*,
            specializations(*),
            users!vendors_user_id_fkey (
              user_specializations (
                specialization_id,
                specializations (*)
              )
            )
          `,
        )
        .neq("status", "merged");

      if (error) {
        console.error("error fetching vendors", error);
        setError(error);
      } else {
        setVendors((data ?? []) as unknown as VendorsWithSpecializations[]);
      }

      setLoading(false);
    }
    fetchVendors();
  }, []); // runs once on mount

  return { vendors, loading, error };
}

export function useVendorsNoUser() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .is("user_id", null);

      if (error) {
        console.error("error fetching vendors", error);
        setError(error);
      } else {
        setVendors(data ?? []);
      }

      setLoading(false);
    }

    fetchVendors();
  }, []);

  return { vendors, loading, error };
}
