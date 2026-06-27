// features/project-stats/utils/aggregators.ts

import {
  DimensionSummary,
  PhaseSummary,
  ProjectExpense,
  ProjectStats,
} from "../../types/project-stats/types";

// Generic groupBy helper — groups expenses by a string key
function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item) || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

// Turn a group of expenses into a DimensionSummary
function summarizeGroup(
  label: string,
  expenses: ProjectExpense[],
  projectTotal: number,
): DimensionSummary {
  const total = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const paid = expenses.reduce((sum, e) => sum + e.amount_paid, 0);
  return {
    label,
    total,
    count: expenses.length,
    average: expenses.length > 0 ? total / expenses.length : 0,
    percentage: projectTotal > 0 ? (total / projectTotal) * 100 : 0,
    paid,
    unpaid: total - paid,
  };
}

export function computeProjectStats(expenses: ProjectExpense[]): ProjectStats {
  if (expenses.length === 0) {
    return emptyStats();
  }

  const totalCost = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const totalPaid = expenses.reduce((sum, e) => sum + e.amount_paid, 0);

  // --- Phase breakdown (most important) ---
  const phaseGroups = groupBy(expenses, (e) => e.phase);
  const byPhase: PhaseSummary[] = Object.entries(phaseGroups)
    .map(([phase, phaseExpenses]) => {
      const base = summarizeGroup(phase, phaseExpenses, totalCost);
      // Nested breakdown by expense type within this phase
      const typeGroups = groupBy(phaseExpenses, (e) => e.expense_type);
      const byExpenseType = Object.entries(typeGroups).map(
        ([type, typeExpenses]) =>
          summarizeGroup(type, typeExpenses, base.total),
      );
      return { ...base, byExpenseType };
    })
    .sort((a, b) => b.total - a.total);

  // --- Expense type breakdown ---
  const typeGroups = groupBy(expenses, (e) => e.expense_type);
  const byExpenseType = Object.entries(typeGroups)
    .map(([type, items]) => summarizeGroup(type, items, totalCost))
    .sort((a, b) => b.total - a.total);

  // --- Contractor breakdown ---
  const contractorExpenses = expenses.filter((e) => e.contractor_id != null);
  const contractorGroups = groupBy(contractorExpenses, (e) => {
    if (e.contractor) {
      return `${e.contractor.first_name} ${e.contractor.last_name ?? ""}`.trim();
    }
    return e.contractor_id ?? "Unknown";
  });
  const byContractor = Object.entries(contractorGroups)
    .map(([name, items]) => summarizeGroup(name, items, totalCost))
    .sort((a, b) => b.total - a.total);

  // --- Vendor breakdown ---
  const vendorExpenses = expenses.filter((e) => e.vendor_id != null);
  const vendorGroups = groupBy(vendorExpenses, (e) => {
    return e.vendor?.vendor_name ?? e.vendor_id ?? "Unknown";
  });
  const byVendor = Object.entries(vendorGroups)
    .map(([name, items]) => summarizeGroup(name, items, totalCost))
    .sort((a, b) => b.total - a.total);

  // --- Expense category breakdown (from expenses.name) ---
  const categoryGroups = groupBy(
    expenses,
    (e) => e.expense_category?.name ?? "Uncategorized",
  );
  const byCategory = Object.entries(categoryGroups)
    .map(([name, items]) => summarizeGroup(name, items, totalCost))
    .sort((a, b) => b.total - a.total);

  // Dominant currency (most common across expenses)
  const currencyCounts = expenses.reduce(
    (acc, e) => {
      acc[e.currency] = (acc[e.currency] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const currency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "LYD";

  return {
    totalCost,
    totalPaid,
    totalUnpaid: totalCost - totalPaid,
    expenseCount: expenses.length,
    currency,
    byPhase,
    byExpenseType,
    byContractor,
    byVendor,
    byCategory,
    averageCostPerPhase: byPhase.length > 0 ? totalCost / byPhase.length : 0,
    averageCostPerContractor:
      byContractor.length > 0 ? totalCost / byContractor.length : 0,
    averageCostPerVendor: byVendor.length > 0 ? totalCost / byVendor.length : 0,
  };
}

function emptyStats(): ProjectStats {
  return {
    totalCost: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    expenseCount: 0,
    currency: "LYD",
    byPhase: [],
    byExpenseType: [],
    byContractor: [],
    byVendor: [],
    byCategory: [],
    averageCostPerPhase: 0,
    averageCostPerContractor: 0,
    averageCostPerVendor: 0,
  };
}
