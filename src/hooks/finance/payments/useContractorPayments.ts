import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { agreementsDb } from "../../../lib/agreementsDb";
import { ContractPayment } from "../../../types/contracts.type";

export function useContractorPayments() {
  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .schema("contracts")
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      const contractorIds = new Set<string>();
      const projectIds = new Set<string>();
      const createdByIds = new Set<string>();
      const expenseIds = new Set<string>();
      const agreementIds = new Set<string>();
      // agreement_id isn't in the generated types yet.
      const agreementIdOf = (p: unknown) =>
        (p as { agreement_id?: string | null }).agreement_id ?? null;

      (paymentsData ?? []).forEach((p) => {
        const agreementId = agreementIdOf(p);
        if (agreementId) agreementIds.add(agreementId);
        if (p.contractor_id) contractorIds.add(p.contractor_id);
        projectIds.add(p.project_id);
        createdByIds.add(p.created_by);
        if (p.expense_id) expenseIds.add(p.expense_id);
      });

      const [
        { data: contractorsData, error: contractorsError },
        { data: projectsData, error: projectsError },
        { data: employeesData, error: employeesError },
        { data: expensesData, error: expensesError },
        { data: agreementsData, error: agreementsError },
      ] = await Promise.all([
        contractorIds.size
          ? supabase
              .from("contractors")
              .select("id, first_name, last_name, whatsapp_number, bank_account_aproved")
              .in("id", Array.from(contractorIds))
          : Promise.resolve({ data: [], error: null }),
        projectIds.size
          ? supabase
              .from("projects")
              .select("id, name, serial_number")
              .in("id", Array.from(projectIds))
          : Promise.resolve({ data: [], error: null }),
        createdByIds.size
          ? supabase
              .from("employees")
              .select("id, first_name, last_name")
              .in("id", Array.from(createdByIds))
          : Promise.resolve({ data: [], error: null }),
        expenseIds.size
          ? supabase
              .from("project_expenses")
              .select("id, serial_number, description")
              .in("id", Array.from(expenseIds))
          : Promise.resolve({ data: [], error: null }),
        agreementIds.size
          ? agreementsDb
              .schema("contracts")
              .from("agreements")
              .select("id, title")
              .in("id", Array.from(agreementIds))
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (contractorsError) throw contractorsError;
      if (projectsError) throw projectsError;
      if (employeesError) throw employeesError;
      if (expensesError) throw expensesError;
      if (agreementsError) throw agreementsError;

      const contractorsMap = new Map(
        (contractorsData ?? []).map((c) => [c.id, c]),
      );
      const projectsMap = new Map((projectsData ?? []).map((p) => [p.id, p]));
      const employeesMap = new Map(
        (employeesData ?? []).map((e) => [e.id, e]),
      );
      const expensesMap = new Map(
        (expensesData ?? []).map((e) => [e.id, e]),
      );
      const agreementsMap = new Map(
        (agreementsData ?? []).map((a) => [a.id, a]),
      );

      setPayments(
        (paymentsData ?? []).map((p) => {
          const agreementId = agreementIdOf(p);
          return {
            ...p,
            contractor: p.contractor_id
              ? (contractorsMap.get(p.contractor_id) ?? null)
              : null,
            project: projectsMap.get(p.project_id) ?? null,
            created_by_employee: employeesMap.get(p.created_by) ?? null,
            expense: p.expense_id
              ? (expensesMap.get(p.expense_id) ?? null)
              : null,
            agreement: agreementId
              ? (agreementsMap.get(agreementId) ?? null)
              : null,
          };
        }),
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

  return { payments, loading, error, refetch: fetchData };
}
