// features/project-stats/types.ts

export type Phase = "construction" | "finishing" | "design" | string;
export type ExpenseType = "material" | "labor" | string;
export type Currency = "LYD" | "USD" | string;
export type ExpenseStatus = "paid" | "pending" | "partial";

// Raw row from Supabase — mirrors your project_expenses table
export interface ProjectExpense {
  id: string;
  project_id: string;
  description: string | null;
  total_amount: number;
  amount_paid: number;
  discounting: number;
  expense_date: string;
  phase: Phase;
  expense_type: ExpenseType;
  status: ExpenseStatus;
  contractor_id: string | null;
  vendor_id: string | null;
  expense_id: string | null; // FK to expenses (category name)
  currency: Currency;
  serial_number: number | null;
  is_edited: boolean;
  created_at: string;
  // Joined fields (when you expand the query)
  contractor?: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  vendor?: { id: string; vendor_name: string } | null;
  expense_category?: { id: string; name: string } | null;
}

// Aggregated summary for a single dimension value (phase, type, etc.)
export interface DimensionSummary {
  label: string; // e.g. "construction", "material", contractor name
  total: number;
  count: number;
  average: number;
  percentage: number; // share of project total (0–100)
  paid: number;
  unpaid: number;
}

// Phase summary extends with expense type breakdown inside the phase
export interface PhaseSummary extends DimensionSummary {
  byExpenseType: DimensionSummary[];
}

// Top-level stats object passed to all components
export interface ProjectStats {
  totalCost: number;
  totalPaid: number;
  totalUnpaid: number;
  expenseCount: number;
  currency: Currency; // dominant currency

  byPhase: PhaseSummary[];
  byExpenseType: DimensionSummary[];
  byContractor: DimensionSummary[];
  byVendor: DimensionSummary[];
  byCategory: DimensionSummary[]; // from expenses.name

  averageCostPerPhase: number;
  averageCostPerContractor: number;
  averageCostPerVendor: number;
}

// Hook return shape
export interface UseProjectStatsResult {
  stats: ProjectStats | null;
  rawExpenses: ProjectExpense[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
