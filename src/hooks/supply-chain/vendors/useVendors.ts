import { useEffect, useState } from "react";
import { ProjectExpenses, Vendor } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export interface ProjectExpenseGroup {
  projectId: string;
  projectName: string;
  projectSerialNumber: number | null;
  expenses: ProjectExpenses[];
}

export function useVendor(vendorId: string) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpenses[]>([]);
  const [groupedExpenses, setGroupedExpenses] = useState<ProjectExpenseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchVendor() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", vendorId)
          .single();

        if (error) {
          console.error("error fetching vendor", error);
          setError(error);
        } else {
          setVendor(data);
        }

        const { data: expensesData, error: expensesError } = await supabase
          .from("project_expenses")
          .select("*, projects(id, name, serial_number)")
          .eq("vendor_id", vendorId)
          .is("deleted_at", null);

        if (expensesError) {
          console.error("error fetching vendor expenses", expensesError);
          setError(expensesError);
        } else {
          const flat = expensesData ?? [];
          setExpenses(flat);

          // Group by project
          const groupMap = new Map<string, ProjectExpenseGroup>();
          for (const expense of flat) {
            const project = expense.projects ;
            const projectId = project?.id ?? "unknown";

            if (!groupMap.has(projectId)) {
              groupMap.set(projectId, {
                projectId,
                projectName: project?.name ?? "Unknown Project",
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
        console.error("unexpected error fetching vendor", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchVendor();
  }, [vendorId]);

  return { vendor, expenses, groupedExpenses, loading, error };
}