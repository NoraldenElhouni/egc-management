import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Contractors } from "../../types/global.type";
import { ContractorBid } from "../../types/contracts.type";

export function useContractor(contractorId: string) {
  const [contractor, setContractor] = useState<Contractors | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchcontractor() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contractors")
          .select("*")
          .eq("id", contractorId)
          .single();

        if (error) {
          console.error("error fetching contractor", error);
          setError(error);
        } else {
          setContractor(data);
        }
      } catch (err) {
        console.error("unexpected error fetching contractor", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchcontractor();
  }, [contractorId]);

  return { contractor, loading, error };
}

// useContractorBids()               // contractor's own submitted bids (all statuses)
export function useContractorBids(contractorId: string) {
  const [bids, setBids] = useState<ContractorBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchcontractor() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contractor_bids")
          .select("*, work_requests(id, title, projects(id, name))")
          .eq("contractor_id", contractorId);

        if (error) {
          console.error("error fetching contractor", error);
          setError(error);
        } else {
          setBids(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching contractor", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchcontractor();
  }, [contractorId]);

  return { bids, loading, error };
}
// useContractorContracts()          // contractor's active/completed contracts
// useContractorPayments()           // contractor's payment history
