import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";
import { Projects } from "../../types/global.type";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Currency = "LYD" | "USD" | "EUR";

export interface ProjectPercentageRow {
  id: string;
  currency: Currency | null;
  type: "cash" | "bank" | null;
  period_percentage: number;
  percentage: number;
  period_start: string;
}

export interface ProjectAssignment {
  id: string;
  percentage: number;
  employee: {
    id: string;
    first_name: string;
    last_name: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
  };
}

export interface DistributionProject extends Projects {
  serial_number: number | null;
  project_percentage: ProjectPercentageRow[];
  project_assignments: ProjectAssignment[];
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface DistributionProgress {
  projectId: string;
  projectName: string;
  status: "pending" | "processing" | "done" | "error";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPeriodTotal(
  rows: ProjectPercentageRow[],
  currency: Currency,
): number {
  return rows
    .filter((r) => r.currency === currency)
    .reduce((sum, r) => sum + (Number(r.period_percentage) || 0), 0);
}

export function getPeriodTotalByCashBank(
  rows: ProjectPercentageRow[],
  currency: Currency,
): { cash: number; bank: number; total: number } {
  const relevant = rows.filter((r) => r.currency === currency);
  const cash = relevant
    .filter((r) => r.type === "cash")
    .reduce((sum, r) => sum + (Number(r.period_percentage) || 0), 0);
  const bank = relevant
    .filter((r) => r.type === "bank")
    .reduce((sum, r) => sum + (Number(r.period_percentage) || 0), 0);
  return { cash, bank, total: cash + bank };
}

export function calcEmployeeEarnings(
  project: DistributionProject,
  currency: Currency,
): {
  employeeId: string;
  name: string;
  assignmentPct: number;
  earning: number;
  cashEarning: number;
  bankEarning: number;
}[] {
  const { cash, bank, total } = getPeriodTotalByCashBank(
    project.project_percentage,
    currency,
  );
  return project.project_assignments.map((a) => {
    const pct = Number(a.percentage) / 100;
    return {
      employeeId: a.employee.id,
      name: `${a.employee.first_name} ${a.employee.last_name ?? ""}`.trim(),
      assignmentPct: Number(a.percentage),
      earning: total * pct,
      cashEarning: cash * pct,
      bankEarning: bank * pct,
    };
  });
}

export function calcDistribution(
  project: DistributionProject,
  currency: Currency,
): {
  total: number;
  cashTotal: number;
  bankTotal: number;
  bank: number;
  company: number;
  employeesTotal: number;
} {
  const {
    cash,
    bank: bankTotal,
    total,
  } = getPeriodTotalByCashBank(project.project_percentage, currency);
  const bankPct = Number(project.default_bank_percentage) / 100;
  const companyPct = Number(project.default_company_percentage) / 100;

  const bank = cash * bankPct + bankTotal * bankPct;
  const company = cash * companyPct + bankTotal * companyPct;
  const employeesTotal = calcEmployeeEarnings(project, currency).reduce(
    (sum, e) => sum + e.earning,
    0,
  );

  return { total, cashTotal: cash, bankTotal, bank, company, employeesTotal };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectsDistribute() {
  const [projects, setProjects] = useState<DistributionProject[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

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
             employee:employees(id, first_name, last_name, bank_name, bank_account_number)
           )`,
        )
        .eq("status", "active")
        .not(
          "id",
          "in",
          `(5451aaae-c632-46f4-9913-8670cffcc8e7,e0a50575-bcc1-474a-98b8-8f57770a14fa,eed51009-4cfa-497c-87a1-cbf5a756f3da)`,
        )
        .order("serial_number", { ascending: true });
      // .neq("id", "5451aaae-c632-46f4-9913-8670cffcc8e7")
      // .neq("id", "e0a50575-bcc1-474a-98b8-8f57770a14fa")
      // .neq("id", "eed51009-4cfa-497c-87a1-cbf5a756f3da")
      // .in("id", [
      //   "5451aaae-c632-46f4-9913-8670cffcc8e7",
      //   "e0a50575-bcc1-474a-98b8-8f57770a14fa",
      //   "eed51009-4cfa-497c-87a1-cbf5a756f3da",
      // ])
      if (error) throw error;

      const filtered = (data ?? []).filter((p) =>
        p.project_percentage?.some(
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

  const submitDistribution = async (
    projects: DistributionProject[],
    createdBy: string,
    onProgress?: (items: DistributionProgress[]) => void, // ← NEW
  ): Promise<{ success: boolean; error?: string }> => {
    const today = new Date().toISOString().split("T")[0];
    const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

    const payrollMap = new Map<
      string,
      { employeeId: string; amount: number }
    >();

    const deltas = {
      main: { cash: 0, bank: 0 },
      bank: { cash: 0, bank: 0 },
    };

    // ── Initialize progress list ──────────────────
    const progressItems: DistributionProgress[] = projects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      status: "pending",
    }));
    onProgress?.([...progressItems]);

    try {
      // ── company accounts ─────────────────────────
      const { data: companyAccounts, error: caError } = await supabase
        .from("company_account")
        .select("id, type, bank_balance, cash_balance")
        .eq("status", "active")
        .in("type", ["main", "bank"]);

      if (caError || !companyAccounts?.length) {
        return { success: false, error: "لم يتم العثور على حسابات الشركة" };
      }

      const mainAccount = companyAccounts.find((a) => a.type === "main");
      const bankAccount = companyAccounts.find((a) => a.type === "bank");

      if (!mainAccount || !bankAccount) {
        return { success: false, error: "حسابات الشركة غير مكتملة" };
      }

      // ── main loop ────────────────────────────────
      for (const project of projects) {
        const progressIdx = progressItems.findIndex(
          (i) => i.projectId === project.id,
        );

        // Mark as processing
        progressItems[progressIdx].status = "processing";
        onProgress?.([...progressItems]);

        try {
          const bankPct = Number(project.default_bank_percentage);
          const companyPct = Number(project.default_company_percentage);

          for (const currency of CURRENCIES) {
            const pctRows = project.project_percentage.filter(
              (r) => r.currency === currency && Number(r.period_percentage) > 0,
            );

            if (!pctRows.length) continue;

            for (const pctRow of pctRows) {
              const rowAmount = Number(pctRow.period_percentage);
              const isBank = pctRow.type === "bank";

              // ── logs fetch ───────────────────────
              const { data: logs, error: logsError } = await supabase
                .from("project_percentage_logs")
                .select("id, amount")
                .eq("project_id", project.id)
                .eq("distributed", false);

              if (logsError) throw logsError;

              const logsSum =
                logs?.reduce((s, l) => s + Number(l.amount), 0) ?? 0;

              if (logs?.length) {
                console.warn(
                  `[${project.name}/${currency}/${pctRow.type}] logs (${logsSum}) ≠ period (${rowAmount})`,
                );
              }

              // ── period insert ─────────────────────
              const { data: period, error: periodError } = await supabase
                .from("project_percentage_periods")
                .insert({
                  project_id: project.id,
                  start_date: pctRow.period_start,
                  end_date: today,
                  total_amount: rowAmount,
                  created_by: createdBy,
                  type: isBank ? "bank" : "cash",
                  company_percentage: companyPct,
                  bank_percentage: bankPct,
                  currency,
                  source_percentage_id: pctRow.id,
                })
                .select("id")
                .single();

              if (periodError || !period) throw periodError;

              const periodId = period.id;

              const bankAmount = rowAmount * (bankPct / 100);
              const companyAmount = rowAmount * (companyPct / 100);

              const employeeRows = project.project_assignments.map((a) => ({
                employeeId: a.employee.id,
                name: `${a.employee.first_name} ${a.employee.last_name ?? ""}`,
                pct: Number(a.percentage),
                amount: rowAmount * (Number(a.percentage) / 100),
              }));

              // ── items ─────────────────────────────
              await supabase.from("project_percentage_period_items").insert([
                {
                  period_id: periodId,
                  item_type: "bank",
                  percentage: bankPct,
                  cash_amount: isBank ? 0 : bankAmount,
                  bank_amount: isBank ? bankAmount : 0,
                  cash_held: 0,
                  bank_held: 0,
                  discount: 0,
                  total: bankAmount,
                },
                {
                  period_id: periodId,
                  item_type: "company",
                  percentage: companyPct,
                  cash_amount: isBank ? 0 : companyAmount,
                  bank_amount: isBank ? companyAmount : 0,
                  cash_held: 0,
                  bank_held: 0,
                  discount: 0,
                  total: companyAmount,
                },
              ]);

              for (const emp of employeeRows) {
                await supabase.from("project_percentage_period_items").insert({
                  period_id: periodId,
                  item_type: "employee",
                  user_id: emp.employeeId,
                  percentage: emp.pct,
                  cash_amount: isBank ? 0 : emp.amount,
                  bank_amount: isBank ? emp.amount : 0,
                  cash_held: 0,
                  bank_held: 0,
                  discount: 0,
                  total: emp.amount,
                });

                const { data: empAcc } = await supabase
                  .from("employee_account")
                  .select("cash_balance, bank_balance")
                  .eq("id", emp.employeeId)
                  .single();

                if (empAcc) {
                  await supabase
                    .from("employee_account")
                    .update(
                      isBank
                        ? {
                            bank_balance:
                              Number(empAcc.bank_balance) + emp.amount,
                          }
                        : {
                            cash_balance:
                              Number(empAcc.cash_balance) + emp.amount,
                          },
                    )
                    .eq("id", emp.employeeId);
                }

                const prev = payrollMap.get(emp.employeeId) ?? {
                  employeeId: emp.employeeId,
                  amount: 0,
                };
                prev.amount += emp.amount;
                payrollMap.set(emp.employeeId, prev);
              }

              // ── logs update ───────────────────────
              if (logs?.length) {
                const { error: updateLogsError } = await supabase
                  .from("project_percentage_logs")
                  .update({ distributed: true })
                  .eq("project_id", project.id)
                  .eq("distributed", false);

                if (updateLogsError) throw updateLogsError;
              }

              // ── reset percentage ──────────────────
              await supabase
                .from("project_percentage")
                .update({ period_percentage: 0 })
                .eq("id", pctRow.id);
            }
          }

          // Mark as done
          progressItems[progressIdx].status = "done";
          onProgress?.([...progressItems]);
        } catch (projectErr) {
          // Mark this project as error but continue with the rest
          progressItems[progressIdx].status = "error";
          onProgress?.([...progressItems]);
          throw projectErr; // re-throw to outer catch
        }
      }

      // ── company accounts update ─────────────────
      await supabase
        .from("company_account")
        .update({
          cash_balance: Number(mainAccount.cash_balance) + deltas.main.cash,
          bank_balance: Number(mainAccount.bank_balance) + deltas.main.bank,
        })
        .eq("id", mainAccount.id);

      await supabase
        .from("company_account")
        .update({
          cash_balance: Number(bankAccount.cash_balance) + deltas.bank.cash,
          bank_balance: Number(bankAccount.bank_balance) + deltas.bank.bank,
        })
        .eq("id", bankAccount.id);

      // ── payroll insert ──────────────────────────
      for (const [, acc] of payrollMap) {
        await supabase.from("payroll").insert({
          employee_id: acc.employeeId,
          pay_date: today,
          percentage_salary: acc.amount,
          total_salary: acc.amount,
          created_by: createdBy,
          status: "pending",
        });
      }

      return { success: true };
    } catch (err) {
      console.error("Distribution error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      };
    }
  };

  return {
    projects,
    loading,
    error,
    submitDistribution,
    refetch: fetchProjects,
  };
}
