import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

// ─── Constants ───────────────────────────────────────────────────────────────
// Hardcoded split of the "remaining" (after employees take their share).
// Change these two values when the split comes from the database.
export const BANK_SPLIT = 0.5; // 50% of remainder → bank/reserve
export const COMPANY_SPLIT = 0.5; // 50% of remainder → company

// ─── Types ───────────────────────────────────────────────────────────────────
export type Currency = "LYD" | "USD" | "EUR";

export interface ProjectPercentageRow {
  id: string;
  currency: Currency | null;
  type: "cash" | "bank" | null;
  period_percentage: number;
  percentage: number;
}

export interface ProjectAssignment {
  id: string;
  percentage: number; // employee's share % of the project
  employee: {
    id: string;
    first_name: string;
    last_name: string | null;
  };
}

export interface DistributionProject {
  id: string;
  name: string;
  serial_number: number | null;
  project_percentage: ProjectPercentageRow[];
  project_assignments: ProjectAssignment[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Sum period_percentage for a given currency across all rows */
export function getPeriodTotal(
  rows: ProjectPercentageRow[],
  currency: Currency,
): number {
  return rows
    .filter((r) => r.currency === currency)
    .reduce((sum, r) => sum + (Number(r.period_percentage) || 0), 0);
}

/** Calculate per-employee earnings for a given currency */
export function calcEmployeeEarnings(
  project: DistributionProject,
  currency: Currency,
): {
  employeeId: string;
  name: string;
  assignmentPct: number;
  earning: number;
}[] {
  const total = getPeriodTotal(project.project_percentage, currency);
  return project.project_assignments.map((a) => ({
    employeeId: a.employee.id,
    name: `${a.employee.first_name} ${a.employee.last_name ?? ""}`.trim(),
    assignmentPct: a.percentage,
    earning: total * (a.percentage / 100),
  }));
}

/** Calculate bank & company share for a given currency */
export function calcDistribution(
  project: DistributionProject,
  currency: Currency,
): { total: number; employeesTotal: number; bank: number; company: number } {
  const total = getPeriodTotal(project.project_percentage, currency);
  const employeesTotal = calcEmployeeEarnings(project, currency).reduce(
    (sum, e) => sum + e.earning,
    0,
  );
  const remaining = total - employeesTotal;
  return {
    total,
    employeesTotal,
    bank: remaining * BANK_SPLIT,
    company: remaining * COMPANY_SPLIT,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProjectsDistribute() {
  const [projects, setProjects] = useState<DistributionProject[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(
            `*,
             project_percentage(*),
             project_assignments(
               id,
               percentage,
               employee:employees(id, first_name, last_name)
             )`,
          )
          .eq("status", "active")
          .order("serial_number", { ascending: true });

        if (error) throw error;

        // Keep only projects that have at least one period_percentage row
        // with a non-zero period_percentage
        const filtered = (data ?? []).filter(
          (p) =>
            p.project_percentage &&
            p.project_percentage.some(
              (pp: ProjectPercentageRow) => Number(pp.period_percentage) > 0,
            ),
        );

        setProjects(filtered as DistributionProject[]);
      } catch (err) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}
