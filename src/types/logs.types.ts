// Types for rows returned by public.get_history() / get_activity() /
// get_log_health() (plans/logging-system/migrations/08_read_api.sql).
// The functions themselves are typed in the generated src/lib/supabase.ts;
// these narrow its plain strings to the values the logging system uses.

/**
 * logs.catalog.log_group: which of the four view_*_logs permissions covers a
 * log. "tasks" is the task log (get_task_activity, view_task_logs).
 */
export type LogGroup = "finance" | "access" | "operations" | "hr" | "tasks";

/** Who caused the event (02-proposed-tables.md §2.1). */
export type LogSource =
  | "user"
  | "delegated"
  | "service_role"
  | "auth"
  | "anon"
  | "system"
  | "backfill";

/** One row returned by get_history() / get_activity(). */
export interface LogEvent {
  log_name: string;
  log_group: LogGroup;
  /** Arabic name of the log (logs.catalog). */
  log_label: string | null;
  /** A number for the logs tables; the task log returns task_activity's uuid. */
  id: number | string;
  occurred_at: string;
  action: string;
  /** Arabic label from logs.labels; falls back to the action token. */
  action_label: string;
  from_value: string | null;
  from_label: string | null;
  to_value: string | null;
  to_label: string | null;
  actor_id: string | null;
  /** Snapshot taken at the time; survives account deletion. */
  actor_name: string | null;
  actor_party: string | null;
  source: LogSource;
  reason: string | null;
  /** Rows written in one database transaction share this. */
  tx_id: number;
  subject_type: string;
  subject_id: string;
  project_id: string | null;
  project_name: string | null;
  amount: number | null;
  currency: string | null;
  /** The log table's typed columns plus its documented detail keys. */
  detail: Record<string, unknown> | null;
}

/**
 * A row of the activity table: one event, or the lead event of one user
 * action with the other events it caused in `related` (see groupEvents.ts).
 */
export type ActivityRow = LogEvent & { related?: ActivityRow[] };

/** get_history(p_ref_type, …): which record's history to load. */
export type HistoryRefType =
  | "shop_order"
  | "contractor_payment"
  | "expense"
  | "payroll"
  | "distribution_period"
  | "project"
  | "employee"
  | "user"
  | "contractor"
  | "vendor"
  | "role"
  | "applicant"
  | "job_request";

export interface LogHealth {
  errors_7d: number;
  last_error_at: string | null;
  last_log_name: string | null;
  last_message: string | null;
}

/** get_task_activity() filters; null/empty means no filter. */
export interface TaskLogFilters {
  spaceId?: string | null;
  projectId?: string | null;
  actorId?: string | null;
  actions?: string[] | null;
  /** ISO timestamps */
  from?: string | null;
  to?: string | null;
}

export interface ActivityFilters {
  groups?: LogGroup[] | null;
  logNames?: string[] | null;
  projectId?: string | null;
  actorId?: string | null;
  /** ISO timestamps */
  from?: string | null;
  to?: string | null;
}
