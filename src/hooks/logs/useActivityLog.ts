import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useMyPermissions } from "../permissions/useCan";
import { LOG_PERMISSIONS } from "../../config/logs";
import type {
  ActivityFilters,
  HistoryRefType,
  LogEvent,
  LogHealth,
  TaskLogFilters,
} from "../../types/logs.types";

const HISTORY_PAGE = 100;
const ACTIVITY_PAGE = 100;
const TASK_LOG_PAGE = 100;

/**
 * True when the user holds at least one of the four log permissions.
 * `undefined` while permissions are still loading.
 */
export function useCanViewLogs(): boolean | undefined {
  const { data, isPending } = useMyPermissions();
  if (isPending) return undefined;
  return LOG_PERMISSIONS.some((p) => data?.has(p));
}

/**
 * Older pages are fetched with `before` = the oldest row's occurred_at.
 * get_task_activity() can return more than a page ("with ties"), never
 * fewer unless it reached the end.
 */
function nextBefore(lastPage: LogEvent[], pageSize: number) {
  return lastPage.length >= pageSize
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

/**
 * The task log page (سجل المهام): the tasks module's own history made
 * readable by get_task_activity(). Empty unless the user has view_task_logs.
 */
export function useTaskActivityLog(filters: TaskLogFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["logs", "tasks", filters],
    enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_task_activity", {
        p_space_id: orUndefined(filters.spaceId),
        p_project_id: orUndefined(filters.projectId),
        p_actor_id: orUndefined(filters.actorId),
        p_actions: orUndefined(filters.actions),
        p_from: orUndefined(filters.from),
        p_to: orUndefined(filters.to),
        p_limit: TASK_LOG_PAGE,
        p_before: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LogEvent[];
    },
    getNextPageParam: (lastPage) => nextBefore(lastPage, TASK_LOG_PAGE),
  });
}

const PARTY_LABEL: Record<string, string> = {
  vendor: "مورد",
  contractor: "مقاول",
  client: "عميل",
};

/** Projects and users for the log pages' filter dialogs. */
export function useLogFilterOptions() {
  return useQuery({
    queryKey: ["logs", "filter-options"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [projects, users] = await Promise.all([
        supabase.from("projects").select("id, name, code").order("serial_number", { ascending: true }),
        supabase.from("users").select("id, first_name, last_name, party_type").order("first_name"),
      ]);
      if (projects.error) throw projects.error;
      if (users.error) throw users.error;
      return {
        projects: (projects.data ?? []).map((p) => ({
          value: p.id,
          label: p.code ? `${p.code} — ${p.name}` : p.name,
        })),
        users: (users.data ?? []).map((u) => {
          const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—";
          const party = PARTY_LABEL[u.party_type as string];
          return { value: u.id, label: party ? `${name} (${party})` : name };
        }),
      };
    },
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
