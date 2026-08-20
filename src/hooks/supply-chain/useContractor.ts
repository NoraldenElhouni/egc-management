import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { contractorWithSpecializations } from "../../types/extended.type";
import { ProjectExpenseGroup } from "./vendors/useVendors";
import { ContractListRow } from "../operations/contracts/useContracts";
import { fetchByIds } from "../operations/contracts/crossSchemaLookup";

export function useContractor(contractorId: string) {
  const [contractor, setContractor] =
    useState<contractorWithSpecializations | null>(null);
  const [groupedExpenses, setGroupedExpenses] = useState<ProjectExpenseGroup[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchcontractor = useCallback(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contractors")
          .select(
            `*,
            specializations (id, name, role_id),
            users (
              user_specializations (
                specialization_id,
                specializations (id, name, role_id)
              )
            )
          `,
          )
          .eq("id", contractorId)
          .single();

        if (error) {
          console.error("error fetching contractor", error);
          setError(error);
        } else {
          setContractor(
            data as unknown as contractorWithSpecializations | null,
          );
        }

        const { data: expensesData, error: expensesError } = await supabase
          .from("project_expenses")
          .select("*, projects(id, name, serial_number)")
          .eq("contractor_id", contractorId)
          .is("deleted_at", null);

        if (expensesError) {
          console.error("error fetching contractor expenses", expensesError);
          setError(expensesError);
        } else {
          const flat = expensesData ?? [];

          const groupMap = new Map<string, ProjectExpenseGroup>();
          for (const expense of flat) {
            const project = expense.projects;
            const projectId = project?.id ?? "unknown";

            if (!groupMap.has(projectId)) {
              groupMap.set(projectId, {
                projectId,
                projectName: project?.name ?? "مشروع غير معروف",
                projectSerialNumber: project?.serial_number ?? null,
                expenses: [],
              });
            }
            const group = groupMap.get(projectId);
            if (group) {
              group.expenses.push(expense);
            }
          }

          setGroupedExpenses(Array.from(groupMap.values()));
        }
      } catch (err) {
        console.error("unexpected error fetching contractor", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
  }, [contractorId]);

  useEffect(() => {
    fetchcontractor();
  }, [fetchcontractor]);

  return {
    contractor,
    groupedExpenses,
    loading,
    error,
    refetch: fetchcontractor,
  };
}

// useContractorContracts()          // contractor's contracts under the new contracts schema
export function useContractorContracts(contractorId: string) {
  const [contracts, setContracts] = useState<ContractListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!contractorId) return;
    async function fetchContracts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema("contracts")
          .from("contracts")
          .select("*, rounds(title)")
          .eq("contractor_id", contractorId);

        if (error) {
          console.error("error fetching contractor contracts", error);
          setError(error);
          setLoading(false);
          return;
        }

        const contractorsById = await fetchByIds<{
          id: string;
          first_name: string;
          last_name: string | null;
        }>("contractors", "id, first_name, last_name", [contractorId]);

        setContracts(
          (data ?? []).map((c) => ({
            ...c,
            contractor: contractorsById[contractorId] ?? null,
          })),
        );
      } catch (err) {
        console.error("unexpected error fetching contractor contracts", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchContracts();
  }, [contractorId]);

  return { contracts, loading, error };
}
// useContractorPayments()           // contractor's payment history
