import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";
import { Projects } from "../../types/global.type";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Currency = "LYD" | "USD" | "EUR";

export interface ProjectPercentageRow {
  id: string;
  currency: Currency | null;
  type: "cash" | "bank" | null; // determines which account balance to credit
  period_percentage: number; // amount accumulated this period
  percentage: number; // cumulative total percentage
  period_start: string; // start date of this period (ISO date string)
}

export interface ProjectAssignment {
  id: string;
  percentage: number; // employee's share % of the project total (0–100)
  employee: {
    id: string;
    first_name: string;
    last_name: string | null;
  };
}

export interface DistributionProject extends Projects {
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

/**
 * Split period total by cash vs bank type for a given currency.
 */
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

/**
 * Per-employee earnings for a given currency, split by cash/bank.
 */
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

/**
 * Full distribution breakdown for display in Step 2.
 * bank/company amounts are split by cash vs bank source type.
 */
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
             employee:employees(id, first_name, last_name)
           )`,
        )
        .eq("status", "active")
        .order("serial_number", { ascending: true });

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

  /**
   * Full distribution submit — processes ALL projects at once.
   *
   * For each project_percentage row with period_percentage > 0:
   *   1.  Fetch undistributed logs and warn if sum doesn't match
   *   2.  Create project_percentage_periods (one per pct row, using period_start → today)
   *   3.  Create project_percentage_period_items (bank, company, each employee)
   *   4.  Credit company_account: bank reserve + company share
   *         → cash rows  → cash_balance
   *         → bank rows  → bank_balance
   *   5.  Credit employee_account per employee
   *         → cash rows  → cash_balance
   *         → bank rows  → bank_balance
   *   6.  Accumulate employee totals for payroll (one record per employee)
   *   7.  Mark logs as distributed = true
   *   8.  Reset period_percentage = 0 on the source row
   *
   * After all projects:
   *   9.  Update company_account balances in one shot
   *   10. Insert payroll records for all employees
   */
  const submitDistribution = async (
    projects: DistributionProject[],
    createdBy: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const today = new Date().toISOString().split("T")[0];
    const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

    // Accumulate employee earnings across all projects — one payroll per employee
    const payrollMap = new Map<
      string,
      { employeeId: string; amount: number }
    >();

    // Accumulate deltas per company account type and balance type
    // mainAccount (type='main') → receives company share
    // bankAccount (type='bank') → receives bank reserve share
    // Within each: cash pct row → cash_balance, bank pct row → bank_balance
    const deltas = {
      main: { cash: 0, bank: 0 },
      bank: { cash: 0, bank: 0 },
    };

    try {
      // ── Fetch both company accounts (main + bank) ─────────────────────────
      const { data: companyAccounts, error: caError } = await supabase
        .from("company_account")
        .select("id, type, bank_balance, cash_balance")
        .eq("status", "active")
        .in("type", ["main", "bank"]);

      if (caError || !companyAccounts || companyAccounts.length === 0) {
        return {
          success: false,
          error: "لم يتم العثور على حسابات الشركة النشطة",
        };
      }

      const mainAccount = companyAccounts.find(
        (a: { type: string }) => a.type === "main",
      );
      const bankAccount = companyAccounts.find(
        (a: { type: string }) => a.type === "bank",
      );

      if (!mainAccount)
        return {
          success: false,
          error: "لم يتم العثور على الحساب الرئيسي (main)",
        };
      if (!bankAccount)
        return {
          success: false,
          error: "لم يتم العثور على حساب البنك الاحتياطي (bank)",
        };

      // ── Loop: project → currency → project_percentage row ─────────────────
      for (const project of projects) {
        const bankPct = Number(project.default_bank_percentage);
        const companyPct = Number(project.default_company_percentage);

        for (const currency of CURRENCIES) {
          const pctRows = project.project_percentage.filter(
            (r) => r.currency === currency && Number(r.period_percentage) > 0,
          );
          if (pctRows.length === 0) continue;

          for (const pctRow of pctRows) {
            const rowAmount = Number(pctRow.period_percentage);
            const isBank = pctRow.type === "bank"; // true = bank type row

            // ── 1. Fetch & validate undistributed logs ──────────────────────
            const { data: logs, error: logsError } = await supabase
              .from("project_percentage_logs")
              .select("id, amount")
              .eq("project_id", project.id)
              .eq("distributed", false);

            if (logsError) throw logsError;

            if (logs && logs.length > 0) {
              const logsSum = logs.reduce(
                (s: number, l: { amount: number }) => s + Number(l.amount),
                0,
              );
              if (Math.abs(logsSum - rowAmount) > 1) {
                console.warn(
                  `[${project.name}/${currency}/${pctRow.type}] logs (${logsSum}) ≠ period (${rowAmount})`,
                );
              }
            }

            // ── 2. Create project_percentage_periods ────────────────────────
            const { data: period, error: periodError } = await supabase
              .from("project_percentage_periods")
              .insert({
                project_id: project.id,
                start_date: pctRow.period_start, // from project_percentage.period_start
                end_date: today,
                total_amount: rowAmount,
                created_by: createdBy,
                type: isBank ? "bank" : "cash",
                company_percentage: companyPct,
                bank_percentage: bankPct,
                currency: currency,
                source_percentage_id: pctRow.id,
              })
              .select("id")
              .single();

            if (periodError || !period)
              throw periodError ?? new Error("Period insert failed");
            const periodId = period.id;

            // ── Calculate amounts ───────────────────────────────────────────
            const bankAmount = rowAmount * (bankPct / 100);
            const companyAmount = rowAmount * (companyPct / 100);
            const employeeRows = project.project_assignments.map((a) => ({
              employeeId: a.employee.id,
              name: `${a.employee.first_name} ${a.employee.last_name ?? ""}`.trim(),
              pct: Number(a.percentage),
              amount: rowAmount * (Number(a.percentage) / 100),
            }));

            // ── 3. Create period items ──────────────────────────────────────

            // Bank reserve item
            const { error: bankItemError } = await supabase
              .from("project_percentage_period_items")
              .insert({
                period_id: periodId,
                item_type: "bank",
                user_id: null,
                percentage: bankPct,
                cash_amount: isBank ? 0 : bankAmount,
                bank_amount: isBank ? bankAmount : 0,
                cash_held: 0,
                bank_held: 0,
                discount: 0,
                total: bankAmount,
              });
            if (bankItemError) throw bankItemError;

            // Company item
            const { error: companyItemError } = await supabase
              .from("project_percentage_period_items")
              .insert({
                period_id: periodId,
                item_type: "company",
                user_id: null,
                percentage: companyPct,
                cash_amount: isBank ? 0 : companyAmount,
                bank_amount: isBank ? companyAmount : 0,
                cash_held: 0,
                bank_held: 0,
                discount: 0,
                total: companyAmount,
              });
            if (companyItemError) throw companyItemError;

            // Employee items
            for (const emp of employeeRows) {
              const { error: empItemError } = await supabase
                .from("project_percentage_period_items")
                .insert({
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
              if (empItemError) throw empItemError;
            }

            // ── 4. Accumulate company_account deltas ────────────────────────
            // bankAmount  → bankAccount  (type='bank',  the emergency/reserve account)
            // companyAmount → mainAccount (type='main', the company operating account)
            // Within each: cash pct row → cash_balance, bank pct row → bank_balance
            if (isBank) {
              deltas.bank.bank += bankAmount;
              deltas.main.bank += companyAmount;
            } else {
              deltas.bank.cash += bankAmount;
              deltas.main.cash += companyAmount;
            }

            // ── 5. Credit employee_account ──────────────────────────────────
            for (const emp of employeeRows) {
              if (emp.amount <= 0) continue;

              const { data: empAcc, error: empAccError } = await supabase
                .from("employee_account")
                .select("id, cash_balance, bank_balance")
                .eq("id", emp.employeeId)
                .single();

              if (empAccError || !empAcc) {
                console.warn(`No employee_account for ${emp.name} — skipping`);
                continue;
              }

              const { error: empUpdateError } = await supabase
                .from("employee_account")
                .update(
                  isBank
                    ? { bank_balance: Number(empAcc.bank_balance) + emp.amount }
                    : {
                        cash_balance: Number(empAcc.cash_balance) + emp.amount,
                      },
                )
                .eq("id", emp.employeeId);

              if (empUpdateError) throw empUpdateError;

              // ── 6. Accumulate for payroll ─────────────────────────────────
              const prev = payrollMap.get(emp.employeeId) ?? {
                employeeId: emp.employeeId,
                amount: 0,
              };
              prev.amount += emp.amount;
              payrollMap.set(emp.employeeId, prev);
            }

            // ── 7. Mark logs as distributed ─────────────────────────────────
            if (logs && logs.length > 0) {
              const { error: updateLogsError } = await supabase
                .from("project_percentage_logs")
                .update({ distributed: true })
                .in(
                  "id",
                  logs.map((l: { id: string }) => l.id),
                );

              if (updateLogsError) throw updateLogsError;
            }

            // ── 8. Reset this row's period_percentage ───────────────────────
            const { error: resetError } = await supabase
              .from("project_percentage")
              .update({ period_percentage: 0 })
              .eq("id", pctRow.id);

            if (resetError) throw resetError;
          }
        }
      }

      // ── 9. Apply company_account balance updates ─────────────────────────
      // Update mainAccount (company share)
      if (deltas.main.cash > 0 || deltas.main.bank > 0) {
        const { error: mainUpdateError } = await supabase
          .from("company_account")
          .update({
            cash_balance: Number(mainAccount.cash_balance) + deltas.main.cash,
            bank_balance: Number(mainAccount.bank_balance) + deltas.main.bank,
          })
          .eq("id", mainAccount.id);
        if (mainUpdateError) throw mainUpdateError;
      }

      // Update bankAccount (bank reserve share)
      if (deltas.bank.cash > 0 || deltas.bank.bank > 0) {
        const { error: bankUpdateError } = await supabase
          .from("company_account")
          .update({
            cash_balance: Number(bankAccount.cash_balance) + deltas.bank.cash,
            bank_balance: Number(bankAccount.bank_balance) + deltas.bank.bank,
          })
          .eq("id", bankAccount.id);
        if (bankUpdateError) throw bankUpdateError;
      }

      // ── 10. Insert payroll records (one per employee, payment method decided at pay time) ──
      for (const [, acc] of payrollMap) {
        if (acc.amount <= 0) continue;

        const { error: payrollError } = await supabase.from("payroll").insert({
          employee_id: acc.employeeId,
          pay_date: today,
          percentage_salary: acc.amount,
          total_salary: acc.amount,
          created_by: createdBy,
          status: "pending",
        });

        if (payrollError) throw payrollError;
      }

      return { success: true };
    } catch (err: unknown) {
      console.error("Distribution error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "حدث خطأ غير متوقع";
      return { success: false, error: errorMessage };
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
