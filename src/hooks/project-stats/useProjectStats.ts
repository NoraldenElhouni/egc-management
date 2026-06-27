// features/project-stats/hooks/useProjectStats.ts

import { useMemo } from "react";
import { useProjectExpenses } from "./useProjectExpenses";
import { UseProjectStatsResult } from "../../types/project-stats/types";
import { computeProjectStats } from "../../utils/project-stats/aggregators";

export function useProjectStats(projectId: string): UseProjectStatsResult {
  const {
    data: rawExpenses,
    isLoading,
    error,
    refetch,
  } = useProjectExpenses(projectId);

  // useMemo ensures aggregation only re-runs when rawExpenses actually changes
  const stats = useMemo(() => {
    if (rawExpenses.length === 0) return null;
    return computeProjectStats(rawExpenses);
  }, [rawExpenses]);

  return { stats, rawExpenses, isLoading, error, refetch };
}
