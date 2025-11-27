import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------------- Types From Your DB ---------------------- */
type AccountRow = {
  balance: number | null;
  held: number | null;
  currency: "LYD" | "USD" | "EUR";
  type: "cash" | "bank";
  total_transactions: number;
  owner_id: string;
};

/* ---------------------- Final Typed Structure ---------------------- */

type FinancialProject = {
  id: string;
  serial_number: number | null;
  name: string;
  clients: {
    first_name: string;
    last_name: string | null;
  } | null;
  accounts: AccountRow[];
  financial: {
    totalExpenses: number;
    totalPaid: number;
    totalIncome: number;
    refunded: number;
    balance: number;
    held: number;
    pendingPayments: number;
  };
};

/* ---------------------- Hook ---------------------- */

export function useProjects() {
  const [projects, setProjects] = useState<FinancialProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);

        /* ---------------------- Fetch Projects ---------------------- */

        const { data: projectRows, error: projectError } = await supabase
          .from("projects")
          .select("id, serial_number, name, clients(first_name, last_name)");
        if (projectError) {
          if (mounted) setError(projectError);
          return;
        }

        if (!projectRows || projectRows.length === 0) {
          if (mounted) setProjects([]);
          return;
        }

        /* ---------------------- Fetch Related Data ---------------------- */

        const compiledProjects: FinancialProject[] = await Promise.all(
          projectRows.map(async (proj): Promise<FinancialProject> => {
            const projectId = proj.id;

            const [expenseRes, incomeRes, accountsRes] = await Promise.all([
              supabase
                .from("project_expenses")
                .select("total_amount, amount_paid, status")
                .eq("project_id", projectId),

              supabase
                .from("project_incomes")
                .select("fund, amount")
                .eq("project_id", projectId),

              supabase
                .from("accounts")
                .select(
                  "balance, held, currency, type, total_transactions, owner_id"
                )
                .eq("owner_type", "project")
                .eq("owner_id", projectId),
            ]);

            const expenses = expenseRes.data ?? [];
            const incomes = incomeRes.data ?? [];
            const accounts = accountsRes.data ?? [];

            /* ---------------------- Financial Calculations ---------------------- */

            const totalExpenses = expenses.reduce(
              (sum, exp) => sum + (exp.total_amount ?? 0),
              0
            );

            const totalPaid = expenses.reduce(
              (sum, exp) => sum + (exp.amount_paid ?? 0),
              0
            );

            const totalIncome = incomes.reduce(
              (sum, inc) =>
                sum + (inc.fund === "client" ? (inc.amount ?? 0) : 0),
              0
            );

            const refunded = incomes.reduce(
              (sum, inc) =>
                sum + (inc.fund === "refund" ? (inc.amount ?? 0) : 0),
              0
            );

            const lydAccounts = accounts.filter((a) => a.currency === "LYD");

            const balance = lydAccounts.reduce(
              (sum, acc) => sum + (acc.balance ?? 0),
              0
            );

            const held = lydAccounts.reduce(
              (sum, acc) => sum + (acc.held ?? 0),
              0
            );

            return {
              id: proj.id,
              serial_number: proj.serial_number,
              name: proj.name,
              clients: proj.clients,
              accounts,

              financial: {
                totalExpenses,
                totalPaid,
                totalIncome,
                refunded,
                balance,
                held,
                pendingPayments: totalExpenses - totalPaid,
              },
            };
          })
        );

        if (mounted) setProjects(compiledProjects);
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return { projects, loading, error };
}
