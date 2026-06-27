import { useProjectStats } from "../../../hooks/project-stats/useProjectStats";
import { KpiCards } from "./KpiCards";
import { PhaseBreakdown } from "./PhaseBreakdown";
import { ExpenseTypeBreakdown } from "./ExpenseTypeBreakdown";
import { ContractorBreakdown } from "./ContractorBreakdown";
import { VendorBreakdown } from "./VendorBreakdown";

export function ProjectStatsTab({ projectId }: { projectId: string }) {
  const { stats, isLoading, error, refetch } = useProjectStats(projectId ?? "");

  if (isLoading)
    return (
      <div className="flex items-center justify-center gap-2 h-40 text-gray-400 text-sm">
        <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
        Loading statistics...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-40 text-sm">
        <p className="text-red-500">{error}</p>
        <button
          onClick={refetch}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Try again
        </button>
      </div>
    );

  if (!stats)
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-40 text-gray-400 text-sm">
        <i className="ti ti-chart-bar-off text-2xl" aria-hidden="true" />
        No expenses recorded yet.
      </div>
    );

  return (
    <div className="p-5 space-y-1">
      <KpiCards stats={stats} />
      <PhaseBreakdown phases={stats.byPhase} />
      <ExpenseTypeBreakdown data={stats.byExpenseType} />
      <ContractorBreakdown data={stats.byContractor} />
      <VendorBreakdown data={stats.byVendor} />
    </div>
  );
}
