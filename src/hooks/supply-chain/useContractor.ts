import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Contractors } from "../../types/global.type";
import { ContractorBid } from "../../types/contracts.type";
import { ProjectExpenseGroup } from "./vendors/useVendors";

export function useContractor(contractorId: string) {
  const [contractor, setContractor] = useState<Contractors | null>(null);
  const [groupedExpenses, setGroupedExpenses] = useState<ProjectExpenseGroup[]>(
    [],
  );
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
    }
    fetchcontractor();
  }, [contractorId]);

  return { contractor, groupedExpenses, loading, error };
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
