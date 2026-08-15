import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { ContractPayment, ContractPaymentPenalty } from "../../../types/contracts.type";

export function useContractorPayments() {
  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [penalties, setPenalties] = useState<ContractPaymentPenalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: paymentsData, error: paymentsError },
        { data: penaltiesData, error: penaltiesError },
      ] = await Promise.all([
        supabase
          .schema("contracts")
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .schema("contracts")
          .from("payments_penalties")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (paymentsError) throw paymentsError;
      if (penaltiesError) throw penaltiesError;

      const contractorIds = new Set<string>();
      const projectIds = new Set<string>();
      const createdByIds = new Set<string>();

      (paymentsData ?? []).forEach((p) => {
        if (p.contractor_id) contractorIds.add(p.contractor_id);
        projectIds.add(p.project_id);
        createdByIds.add(p.created_by);
      });
      (penaltiesData ?? []).forEach((p) => {
        contractorIds.add(p.contractor_id);
        projectIds.add(p.project_id);
        createdByIds.add(p.created_by);
      });

      const [
        { data: contractorsData, error: contractorsError },
        { data: projectsData, error: projectsError },
        { data: employeesData, error: employeesError },
      ] = await Promise.all([
        contractorIds.size
          ? supabase
              .from("contractors")
              .select(
                "id, first_name, last_name, whatsapp_number, bank_account_aproved",
              )
              .in("id", Array.from(contractorIds))
          : Promise.resolve({ data: [], error: null }),
        projectIds.size
          ? supabase
              .from("projects")
              .select("id, name")
              .in("id", Array.from(projectIds))
          : Promise.resolve({ data: [], error: null }),
        createdByIds.size
          ? supabase
              .from("employees")
              .select("id, first_name, last_name")
              .in("id", Array.from(createdByIds))
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (contractorsError) throw contractorsError;
      if (projectsError) throw projectsError;
      if (employeesError) throw employeesError;

      const contractorsMap = new Map(
        (contractorsData ?? []).map((c) => [c.id, c]),
      );
      const projectsMap = new Map((projectsData ?? []).map((p) => [p.id, p]));
      const employeesMap = new Map(
        (employeesData ?? []).map((e) => [e.id, e]),
      );
      const paymentsMap = new Map((paymentsData ?? []).map((p) => [p.id, p]));

      setPayments(
        (paymentsData ?? []).map((p) => ({
          ...p,
          contractor: p.contractor_id
            ? (contractorsMap.get(p.contractor_id) ?? null)
            : null,
          project: projectsMap.get(p.project_id) ?? null,
          created_by_employee: employeesMap.get(p.created_by) ?? null,
        })),
      );

      setPenalties(
        (penaltiesData ?? []).map((p) => ({
          ...p,
          contractor: contractorsMap.get(p.contractor_id) ?? null,
          project: projectsMap.get(p.project_id) ?? null,
          linked_payment: p.payment_id
            ? (paymentsMap.get(p.payment_id) ?? null)
            : null,
          created_by_employee: employeesMap.get(p.created_by) ?? null,
        })),
      );
    } catch (err) {
      console.error("Error fetching contractor payments:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { payments, penalties, loading, error, refetch: fetchData };
}
