import { supabase } from "../../lib/supabaseClient";

// =====================================================================
// The notification system's database functions (public.notify_*), typed.
//
// Notifications are emitted by the database (plans/notification-system):
// this app no longer sends pushes itself. It reads its inbox, marks read,
// keeps the user's settings, and — for admins — edits the rules.
//
// These functions are newer than the generated types; the cast below is
// the same one useTaskAccess.ts uses for tasks.my_access. Once
// `npm run types` has run against the migrated database it can go.
// =====================================================================

type RpcResult<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;
const rpcClient = supabase as unknown as { rpc: <T>(fn: string, args?: Record<string, unknown>) => RpcResult<T> };

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpcClient.rpc<T>(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

// ---------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------
export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface NotificationItem {
  id: string;
  event_key: string;
  category: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  project_id: string | null;
  group_count: number;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export const PAGE_SIZE = 30;

export const listNotifications = (opts: { before?: string | null; unreadOnly?: boolean; category?: string | null; limit?: number } = {}) =>
  call<NotificationItem[]>("notify_list", {
    p_app: "electron",
    p_limit: opts.limit ?? PAGE_SIZE,
    p_before: opts.before ?? null,
    p_unread_only: opts.unreadOnly ?? false,
    p_category: opts.category ?? null,
  }).then((rows) => rows ?? []);

export const unreadCount = () => call<number>("notify_unread_count").then((n) => n ?? 0);
export const markRead = (ids: string[]) => call<number>("notify_mark_read", { p_ids: ids });
export const markAllRead = () => call<number>("notify_mark_all_read");
export const archiveNotifications = (ids: string[]) => call<number>("notify_archive", { p_ids: ids });

// ---------------------------------------------------------------------
// My settings
// ---------------------------------------------------------------------
export type DeliveryMode = "immediate" | "digest" | "off";

export interface NotificationSettings {
  quiet: { enabled: boolean; start: string; end: string };
  muted_until: string | null;
  digest_morning: boolean;
  categories: { key: string; name_ar: string; mode: DeliveryMode; has_critical: boolean }[];
  muted: { entity_type: string; entity_id: string; name: string | null }[];
}

export const getSettings = () => call<NotificationSettings>("notify_get_settings");
export const setSettings = (settings: Partial<{ quiet: Partial<NotificationSettings["quiet"]>; muted_until: string | null; digest_morning: boolean }>) =>
  call<NotificationSettings>("notify_set_settings", { p_settings: settings });
export const setPreference = (category: string, mode: DeliveryMode) =>
  call<void>("notify_set_preference", { p_category: category, p_mode: mode });
/** mode "all" = follow, "none" = mute, null = back to normal */
export const subscribe = (entityType: string, entityId: string, mode: "all" | "none" | null) =>
  call<void>("notify_subscribe", { p_entity_type: entityType, p_entity_id: entityId, p_mode: mode });

// ---------------------------------------------------------------------
// "Chase overdue work"
// ---------------------------------------------------------------------
export interface NudgeResult {
  sent: string[];
  inbox_only: string[];
  duplicate: string[];
  allowed_tasks: number;
  requested_tasks: number;
}

export const sendOverdueNudge = (taskIds: string[], title: string, message: string) =>
  call<NudgeResult>("notify_send_overdue_nudge", { p_task_ids: taskIds, p_title: title, p_message: message });

// ---------------------------------------------------------------------
// Admin console (manage_notifications)
// ---------------------------------------------------------------------
export type AdminKind =
  | "event_types"
  | "watch_rules"
  | "enrichments"
  | "reminder_rules"
  | "check_rules"
  | "escalation_levels"
  | "sources"
  | "config"
  | "channels"
  | "deep_links"
  | "permissions"
  | "project_roles"
  | "watched_tables";

export interface EventTypeRow {
  key: string;
  name_ar: string;
  description_ar: string | null;
  category: string;
  category_ar?: string;
  class: "alert" | "reminder" | "check" | "digest";
  priority: NotificationPriority;
  audience: string[];
  gate_permission: string | null;
  channels: string[];
  dedup_window: string;
  group_mode: "none" | "transaction";
  title_template: string;
  body_template: string;
  group_title_template: string | null;
  group_body_template: string | null;
  entity_type: string | null;
  is_active: boolean;
  is_system: boolean;
  sent_7d?: number;
}

/** A recipient rule, as the database's notify.resolve_rule() reads it. */
export type RecipientRule =
  | { type: "user"; id: string }
  | { type: "column"; column: string }
  | { type: "permission"; name: string }
  | { type: "project_role"; role_ids: string[] }
  | { type: "manager_of"; path: string }
  | { type: "watchers" }
  | { type: "party"; party_type: "vendor" | "contractor" | "client"; path: string; capability?: string }
  | { type: "task_assignees"; path: string }
  | { type: "task_creator"; path: string }
  | { type: "space_manager"; path: string };

export type Recipients = RecipientRule | RecipientRule[];

export interface ConditionLeaf {
  field: string;
  op: string;
  value?: unknown;
}
export type Condition = Record<string, never> | ConditionLeaf | { all: Condition[] } | { any: Condition[] } | { not: Condition };

export interface WatchRuleRow {
  id: string;
  name_ar: string;
  source_table: string;
  db_event: "insert" | "update" | "delete";
  condition: Condition;
  event_key: string;
  event_name_ar?: string;
  recipients: Recipients;
  entity_type: string | null;
  entity_id_path: string;
  project_path: string | null;
  dedup_suffix: string | null;
  handler: string | null;
  mode: "off" | "shadow" | "live";
  is_system: boolean;
  updated_at: string;
}

export interface ReminderRuleRow {
  id: string;
  name_ar: string;
  source: string;
  date_column: string;
  filter: Condition;
  offsets: number[];
  event_key: string;
  event_name_ar?: string;
  recipients: Recipients;
  is_active: boolean;
  is_system: boolean;
}

export interface CheckRuleRow {
  id: string;
  name_ar: string;
  source: string;
  filter: Condition;
  age_column: string | null;
  age_days_column: string | null;
  threshold: string;
  schedule: "hourly" | "daily";
  event_key: string;
  event_name_ar?: string;
  ladder: string;
  recovered_event_key: string | null;
  entity_key_template: string;
  baseline_summary_recipients: Recipients | null;
  baseline_done: boolean;
  last_run_at: string | null;
  open_count?: number;
  is_active: boolean;
  is_system: boolean;
}

export interface LadderLevelRow {
  ladder: string;
  level: number;
  after: string;
  recipients: Recipients;
  priority: NotificationPriority | null;
}

export interface SourceRow {
  name: string;
  label_ar: string;
  entity_type: string | null;
  id_column: string;
  project_column: string | null;
}

export interface ConfigRow {
  key: string;
  value: unknown;
  description_ar: string | null;
  updated_at: string;
}

export interface ChannelRow {
  key: "inapp" | "push" | "email" | "whatsapp";
  name_ar: string;
  is_enabled: boolean;
}

export interface WatchedTableRow {
  table_name: string;
  attached_at: string;
  rules: number;
  writes: number;
}

export interface TableInfo {
  table_name: string;
  writes: number;
  rows: number;
  watched: boolean;
  columns: { name: string; type: string }[];
}

export interface PreviewResult {
  empty?: boolean;
  matches?: boolean;
  recipients?: { user_id: string; name: string | null; party_type: string; snoozed: boolean }[];
  recipient_count?: number;
  title?: string;
  body?: string;
  group_title?: string;
  group_body?: string;
  note?: string | null;
  sample_id?: string;
}

export interface SimulationRow {
  id: number;
  created_at: string;
  rule_kind: string;
  rule_id: string | null;
  event_key: string;
  title: string;
  body: string;
  recipients: (string | null)[];
}

export interface HistoryRow {
  id: number;
  occurred_at: string;
  action: string;
  action_ar: string;
  actor_name: string | null;
  rule_kind: string;
  rule_key: string;
  rule_name: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export const adminList = <T>(kind: AdminKind) => call<T[]>("notify_admin_list", { p_kind: kind }).then((rows) => rows ?? []);
export const adminTables = () => call<TableInfo[]>("notify_admin_tables").then((rows) => rows ?? []);

/** Saves one row. A watch rule that would reach many people comes back with
 *  needs_confirm; call again with confirm = true. */
export const adminSave = <T>(kind: AdminKind, row: Record<string, unknown>, confirm = false) =>
  call<T | { needs_confirm: true; recipient_count: number }>("notify_admin_save", { p_kind: kind, p_row: row, p_confirm: confirm });
export const adminDelete = (kind: AdminKind, id: string) => call<void>("notify_admin_delete", { p_kind: kind, p_id: id });
export const adminPreview = (kind: "watch_rules" | "event_types", row: Record<string, unknown>, sampleId?: string | null) =>
  call<PreviewResult>("notify_admin_preview", { p_kind: kind, p_row: row, p_sample_id: sampleId ?? null });
export const adminAttach = (table: string) => call<void>("notify_admin_attach", { p_table: table });
export const adminDetach = (table: string) => call<void>("notify_admin_detach", { p_table: table });
export const adminSimulations = (limit = 100) => call<SimulationRow[]>("notify_admin_simulations", { p_limit: limit }).then((r) => r ?? []);
export const adminTest = (eventKey: string) => call<number>("notify_admin_test", { p_event_key: eventKey });
export const adminHistory = (kind?: string | null, key?: string | null, limit = 100) =>
  call<HistoryRow[]>("notify_admin_history", { p_kind: kind ?? null, p_key: key ?? null, p_limit: limit }).then((r) => r ?? []);

// ---------------------------------------------------------------------
// Delivery log (view_notification_log)
// ---------------------------------------------------------------------
export interface DeliveryRow {
  id: number;
  created_at: string;
  event_key: string;
  event_name_ar: string;
  recipient_id: string;
  recipient: string | null;
  channel: string;
  status: "queued" | "sending" | "sent" | "failed" | "skipped" | "suppressed";
  reason: string | null;
  error: string | null;
  scheduled_for: string;
  sent_at: string | null;
  receipt_status: string | null;
  title: string;
  read_at: string | null;
}

export interface DeliveryStats {
  since: string;
  by_event: { event_key: string; event_name_ar: string; notifications: number; push_sent: number; push_failed: number; push_skipped: number; read: number }[];
  skip_reasons: Record<string, number>;
  failure_rate: number | null;
  median_push_seconds: number | null;
  active_devices: number;
  muted_categories: Record<string, number>;
  errors_7d: number;
}

export interface UserTrace {
  user: { id: string; name: string | null; party_type: string; status: string } | null;
  devices: { app_id: string; platform: string; is_active: boolean; deactivated_reason: string | null; last_seen_at: string; failure_count: number }[];
  settings: Record<string, unknown> | null;
  preferences: Record<string, string>;
  muted: { entity_type: string; entity_id: string }[];
  notifications: {
    id: string;
    created_at: string;
    event_key: string;
    title: string;
    read_at: string | null;
    deliveries: { channel: string; status: string; reason: string | null; error: string | null; sent_at: string | null; scheduled_for: string; receipt_status: string | null }[];
  }[];
}

export interface ErrorRow {
  id: number;
  occurred_at: string;
  source: string;
  event_key: string | null;
  rule_id: string | null;
  sqlstate: string | null;
  message: string | null;
  context: Record<string, unknown> | null;
}

export const logDeliveries = (f: { from?: string | null; to?: string | null; eventKey?: string | null; userId?: string | null; status?: string | null; limit?: number }) =>
  call<DeliveryRow[]>("notify_log_deliveries", {
    p_from: f.from ?? null,
    p_to: f.to ?? null,
    p_event_key: f.eventKey ?? null,
    p_user_id: f.userId ?? null,
    p_status: f.status ?? null,
    p_limit: f.limit ?? 300,
  }).then((r) => r ?? []);
export const logStats = (days = 7) => call<DeliveryStats>("notify_log_stats", { p_days: days });
export const logUser = (userId: string, days = 7) => call<UserTrace>("notify_log_user", { p_user_id: userId, p_days: days });
export const logErrors = (limit = 100) => call<ErrorRow[]>("notify_log_errors", { p_limit: limit }).then((r) => r ?? []);
