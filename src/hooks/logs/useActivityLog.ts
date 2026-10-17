import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useMyPermissions } from "../permissions/useCan";
import { LOG_PERMISSIONS } from "../../config/logs";
import type {
  ActivityFilters,
  HistoryRefType,
  LogEvent,
  LogHealth,
} from "../../types/logs.types";

const HISTORY_PAGE = 100;
const ACTIVITY_PAGE = 100;

/**
 * True when the user holds at least one of the four log permissions.
 * `undefined` while permissions are still loading.
 */
export function useCanViewLogs(): boolean | undefined {
  const { data, isPending } = useMyPermissions();
  if (isPending) return undefined;
  return LOG_PERMISSIONS.some((p) => data?.has(p));
}

/** Older pages are fetched with `before` = the oldest row's occurred_at. */
function nextBefore(lastPage: LogEvent[], pageSize: number) {
  return lastPage.length === pageSize
    ? lastPage[lastPage.length - 1].occurred_at
    : undefined;
}

/** The RPCs treat a left-out filter as "no filter"; empty means left out. */
const orUndefined = <T,>(value: T | null | undefined): T | undefined =>
  value === null || value === "" || (Array.isArray(value) && value.length === 0)
    ? undefined
    : value;

/**
 * The history of one record (an order, a payment, an employee, a project…),
 * newest first. Only rows from log groups the user may read come back;
 * the database enforces that, not this hook.
 */
export function useHistory(
  refType: HistoryRefType,
  refId: string | undefined,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["logs", "history", refType, refId],
    enabled: enabled && !!refId,
    staleTime: 15_000,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_history", {
        p_ref_type: refType,
        p_ref_id: refId as string,
        p_limit: HISTORY_PAGE,
        p_before: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LogEvent[];
    },
    getNextPageParam: (lastPage) => nextBefore(lastPage, HISTORY_PAGE),
  });
}

/** The activity log page: every event the user may read, filtered. */
export function useActivityLog(filters: ActivityFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["logs", "activity", filters],
    enabled,
    staleTime: 15_000,
    // Keep showing the current rows while a changed filter loads.
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_activity", {
        p_groups: orUndefined(filters.groups),
        p_log_names: orUndefined(filters.logNames),
        p_project_id: orUndefined(filters.projectId),
        p_actor_id: orUndefined(filters.actorId),
        p_from: orUndefined(filters.from),
        p_to: orUndefined(filters.to),
        p_limit: ACTIVITY_PAGE,
        p_before: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LogEvent[];
    },
    getNextPageParam: (lastPage) => nextBefore(lastPage, ACTIVITY_PAGE),
  });
}

/** Failed log writes in the last 7 days (logs.write_errors). */
export function useLogHealth(enabled = true) {
  return useQuery<LogHealth | null>({
    queryKey: ["logs", "health"],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_log_health");
      if (error) throw error;
      return ((data ?? []) as unknown as LogHealth[])[0] ?? null;
    },
  });
}
