import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectOverview {
  id: string;
  name: string;
  code: string;
  address: string | null;
  status: "active" | "completed" | "on_hold" | "cancelled";
  description: string | null;
  created_at: string;
  default_company_percentage: number;
  default_bank_percentage: number;
  client: {
    first_name: string;
    last_name: string | null;
    email: string;
    phone_number: string;
  };
}

export interface ProjectBalanceSummary {
  currency: string;
  balance: number;
  total_transactions: number;
  total_expense: number;
  total_percentage: number;
  refund: number;
  maps: number;
}

export interface ProjectStats {
  total_incomes: number;
  total_expenses: number;
  total_expenses_paid: number;
  total_expenses_unpaid: number;
  total_refunds: number;
  expense_count: number;
  income_count: number;
  primary_currency: string;
}

export interface ContractorStats {
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;
  total_bids: number;
  pending_bids: number;
}

export interface MilestoneStats {
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
}

export interface AssignmentStats {
  total_assigned: number;
  assignments: Array<{
    user_id: string;
    first_name: string;
    last_name: string | null;
    role: string | null;
    percentage: number;
  }>;
}

export interface PaymentRequestStats {
  total: number;
  pending: number;
  approved: number;
  declined: number;
  total_amount: number;
}

// ─── Fetchers (Supabase) ──────────────────────────────────────────────────────

const fetchProjectOverview = async (
  projectId: string,
): Promise<ProjectOverview> => {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      code,
      address,
      status,
      description,
      created_at,
      default_company_percentage,
      default_bank_percentage,
      clients (
        first_name,
        last_name,
        email,
        phone_number
      )
    `,
    )
    .eq("id", projectId)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    client: Array.isArray(data.clients) ? data.clients[0] : data.clients,
  } as ProjectOverview;
};

const fetchProjectBalances = async (
  projectId: string,
): Promise<ProjectBalanceSummary[]> => {
  const { data, error } = await supabase
    .from("project_balances")
    .select(
      "currency, balance, total_transactions, total_expense, total_percentage, refund, maps",
    )
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectBalanceSummary[];
};

const fetchProjectStats = async (projectId: string): Promise<ProjectStats> => {
  // Fetch incomes, expenses, and refunds in parallel
  const [incomesRes, expensesRes, refundsRes] = await Promise.all([
    supabase
      .from("project_incomes")
      .select("amount, currency")
      .eq("project_id", projectId),
    supabase
      .from("project_expenses")
      .select("total_amount, amount_paid, currency")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    supabase
      .from("project_refund")
      .select("amount")
      .eq("project_id", projectId),
  ]);

  if (incomesRes.error) throw new Error(incomesRes.error.message);
  if (expensesRes.error) throw new Error(expensesRes.error.message);
  if (refundsRes.error) throw new Error(refundsRes.error.message);

  const incomes = incomesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const refunds = refundsRes.data ?? [];

  const total_incomes = incomes.reduce((s, r) => s + Number(r.amount), 0);
  const total_expenses = expenses.reduce(
    (s, r) => s + Number(r.total_amount),
    0,
  );
  const total_expenses_paid = expenses.reduce(
    (s, r) => s + Number(r.amount_paid),
    0,
  );
  const total_refunds = refunds.reduce((s, r) => s + Number(r.amount), 0);

  // Determine the most-used currency for display
  const currencyCount: Record<string, number> = {};
  [...incomes, ...expenses].forEach((r) => {
    if (r.currency)
      currencyCount[r.currency] = (currencyCount[r.currency] ?? 0) + 1;
  });
  const primary_currency =
    Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "LYD";

  return {
    total_incomes,
    total_expenses,
    total_expenses_paid,
    total_expenses_unpaid: total_expenses - total_expenses_paid,
    total_refunds,
    expense_count: expenses.length,
    income_count: incomes.length,
    primary_currency,
  };
};

const fetchContractorStats = async (
  projectId: string,
): Promise<ContractorStats> => {
  const [contractsRes] = await Promise.all([
    supabase.from("contracts").select("id, status").eq("project_id", projectId),
  ]);

  // Fallback: fetch bids via work_requests
  const { data: workRequests } = await supabase
    .from("work_requests")
    .select("id")
    .eq("project_id", projectId);

  const requestIds = (workRequests ?? []).map((r) => r.id);

  const { data: bids, error: bidsError } =
    requestIds.length > 0
      ? await supabase
          .from("contractor_bids")
          .select("id, status")
          .in("request_id", requestIds)
      : { data: [], error: null };

  if (contractsRes.error) throw new Error(contractsRes.error.message);
  if (bidsError) throw new Error(bidsError.message);

  const contracts = contractsRes.data ?? [];
  const allBids = bids ?? [];

  return {
    total_contracts: contracts.length,
    active_contracts: contracts.filter((c) => c.status === "active").length,
    completed_contracts: contracts.filter((c) => c.status === "completed")
      .length,
    total_bids: allBids.length,
    pending_bids: allBids.filter((b) => b.status === "pending").length,
  };
};

const fetchMilestoneStats = async (
  projectId: string,
): Promise<MilestoneStats> => {
  // Get all contracts for this project, then their milestones
  const { data: contracts, error: contractsErr } = await supabase
    .from("contracts")
    .select("id")
    .eq("project_id", projectId);

  if (contractsErr) throw new Error(contractsErr.message);

  const contractIds = (contracts ?? []).map((c) => c.id);
  if (contractIds.length === 0) {
    return { total: 0, completed: 0, pending: 0, in_progress: 0 };
  }

  const { data, error } = await supabase
    .from("contract_milestones")
    .select("id, status")
    .in("contract_id", contractIds);

  if (error) throw new Error(error.message);

  const milestones = data ?? [];
  return {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "completed").length,
    pending: milestones.filter((m) => m.status === "pending").length,
    in_progress: milestones.filter((m) => m.status === "in_progress").length,
  };
};

const fetchAssignmentStats = async (
  projectId: string,
): Promise<AssignmentStats> => {
  const { data, error } = await supabase
    .from("project_assignments")
    .select(
      `
      percentage,
      employees (
        id,
        first_name,
        last_name
      ),
      project_roles (
        name
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    console.error(error);
    throw error;
  }

  const assignments = (data ?? []).map((row) => ({
    user_id: row.employees?.id ?? "",
    first_name: row.employees?.first_name ?? "",
    last_name: row.employees?.last_name ?? null,
    role: row.project_roles?.name ?? null,
    percentage: Number(row.percentage),
  }));

  return {
    total_assigned: assignments.length,
    assignments,
  };
};

const fetchPaymentRequestStats = async (
  projectId: string,
): Promise<PaymentRequestStats> => {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("id, status, amount")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    declined: rows.filter((r) => r.status === "declined").length,
    total_amount: rows.reduce((s, r) => s + Number(r.amount), 0),
  };
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useProjectOverview = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "overview"],
    queryFn: () => fetchProjectOverview(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

export const useProjectBalances = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "balances"],
    queryFn: () => fetchProjectBalances(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

export const useProjectStats = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "stats"],
    queryFn: () => fetchProjectStats(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

export const useContractorStats = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "contractor-stats"],
    queryFn: () => fetchContractorStats(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

export const useMilestoneStats = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "milestone-stats"],
    queryFn: () => fetchMilestoneStats(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

export const useAssignmentStats = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "assignments"],
    queryFn: () => fetchAssignmentStats(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  });

export const usePaymentRequestStats = (projectId: string) =>
  useQuery({
    queryKey: ["project", projectId, "payment-requests-stats"],
    queryFn: () => fetchPaymentRequestStats(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });
