import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchDetailProject {
  projectId: string;
  projectName: string;
  projectSerial: number | null;
  totalsByCurrency: Record<string, number>;
  employeeCount: number;
  hasReversed: boolean;
}

export interface BatchDetailEmployee {
  employeeId: string;
  firstName: string;
  lastName: string | null;
  specialization: string | null;
  projectCount: number;
  totalsByCurrency: Record<string, number>;
}

export interface BatchDetail {
  date: string;
  projects: BatchDetailProject[];
  employees: BatchDetailEmployee[];
  totalsByCurrency: Record<string, number>;
  totalEmployeeCount: number;
  hasReversed: boolean;
}

type RawItem = {
  item_type: string;
  user_id: string | null;
  total: number;
  period_id: string;
  period: {
    project_id: string;
    currency: string;
    status: string;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string | null;
    specializations: { name: string } | null;
  } | null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBatchDetail(date: string) {
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!date) return;
    fetchBatchDetail();
  }, [date]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all periods for this date, with their items + employee info
      const { data: periods, error: periodsError } = await supabase
        .from("project_percentage_periods")
        .select(
          `id, project_id, currency, status, total_amount,
           project:projects(id, name, serial_number),
           items:project_percentage_period_items(
             item_type, user_id, total, period_id,
             employee:employees(
               id, first_name, last_name,
               specializations:specializations(name)
             )
           )`,
        )
        .eq("end_date", date)
        .order("created_at", { ascending: false });

      if (periodsError) throw periodsError;

      // ── Build project map ──────────────────────────────────────────────────
      const projectMap = new Map<string, BatchDetailProject>();

      for (const period of periods ?? []) {
        const pid = period.project_id;
        const isReversed = period.status === "reversed";
        const currency: string = period.currency ?? "LYD";

        if (!projectMap.has(pid)) {
          projectMap.set(pid, {
            projectId: pid,
            projectName: period.project?.name ?? "—",
            projectSerial: period.project?.serial_number ?? null,
            totalsByCurrency: {},
            employeeCount: 0,
            hasReversed: false,
          });
        }

        const proj = projectMap.get(pid)!;

        if (isReversed) {
          proj.hasReversed = true;
        } else {
          proj.totalsByCurrency[currency] =
            (proj.totalsByCurrency[currency] ?? 0) +
            Number(period.total_amount);
        }

        // Count unique employees in this period
        const empIds = new Set<string>(
          (period.items as RawItem[])
            .filter((i) => i.item_type === "employee" && i.user_id !== null)
            .map((i) => i.user_id as string),
        );
        // We'll recount properly below; just accumulate for now
        empIds.forEach(() => {}); // placeholder
      }

      // ── Build employee map ─────────────────────────────────────────────────
      // We need unique employees with their totals summed across all active periods
      const employeeMap = new Map<
        string,
        {
          employeeId: string;
          firstName: string;
          lastName: string | null;
          specialization: string | null;
          projectIds: Set<string>;
          totalsByCurrency: Record<string, number>;
        }
      >();

      // Also track per-project unique employee IDs for employeeCount
      const projectEmployeeIds = new Map<string, Set<string>>();

      for (const period of periods ?? []) {
        const isReversed = period.status === "reversed";
        const currency: string = period.currency ?? "LYD";
        const pid = period.project_id;

        if (!projectEmployeeIds.has(pid))
          projectEmployeeIds.set(pid, new Set());

        for (const item of (period.items as RawItem[]).filter(
          (i) =>
            i.item_type === "employee" &&
            i.user_id !== null &&
            i.employee !== null,
        )) {
          const uid = item.user_id as string;
          const emp = item.employee!;

          projectEmployeeIds.get(pid)!.add(uid);

          if (!employeeMap.has(uid)) {
            employeeMap.set(uid, {
              employeeId: uid,
              firstName: emp.first_name,
              lastName: emp.last_name,
              specialization: emp.specializations?.name ?? null,
              projectIds: new Set(),
              totalsByCurrency: {},
            });
          }

          const entry = employeeMap.get(uid)!;
          entry.projectIds.add(pid);

          if (!isReversed) {
            entry.totalsByCurrency[currency] =
              (entry.totalsByCurrency[currency] ?? 0) + Number(item.total);
          }
        }
      }

      // Patch employeeCount onto each project
      for (const [pid, empIds] of projectEmployeeIds.entries()) {
        const proj = projectMap.get(pid);
        if (proj) proj.employeeCount = empIds.size;
      }

      // ── Build batch-level totals ───────────────────────────────────────────
      const totalsByCurrency: Record<string, number> = {};
      const allEmployeeIds = new Set<string>();

      for (const period of periods ?? []) {
        if (period.status === "reversed") continue;
        const currency: string = period.currency ?? "LYD";
        totalsByCurrency[currency] =
          (totalsByCurrency[currency] ?? 0) + Number(period.total_amount);
      }

      employeeMap.forEach((_, uid) => allEmployeeIds.add(uid));

      const result: BatchDetail = {
        date,
        projects: Array.from(projectMap.values()),
        employees: Array.from(employeeMap.values()).map((e) => ({
          employeeId: e.employeeId,
          firstName: e.firstName,
          lastName: e.lastName,
          specialization: e.specialization,
          projectCount: e.projectIds.size,
          totalsByCurrency: e.totalsByCurrency,
        })),
        totalsByCurrency,
        totalEmployeeCount: allEmployeeIds.size,
        hasReversed: (periods ?? []).some((p) => p.status === "reversed"),
      };

      setBatch(result);
    } catch (err) {
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  };

  return { batch, loading, error, refetch: fetchBatchDetail };
}
