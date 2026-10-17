import type { ActivityRow, LogEvent } from "../../types/logs.types";

// One user action can write several log rows across several transactions:
// saving an expense is four requests from the desktop app (the expense, the
// project balance, the payment, the account balance), so tx_id alone cannot
// join them. Rows from the same person on the same project this close
// together are treated as one action.
const SAME_ACTION_GAP_MS = 3000;

const time = (e: LogEvent) => new Date(e.occurred_at).getTime();

/**
 * One balance update writes a balance_change row per column (balance,
 * total_expense, total_percentage…). Rows from the same transaction on the
 * same balance row become one event whose detail.changes holds every field;
 * its amount is the change in `balance` (the net effect).
 */
export function mergeBalanceRows(events: LogEvent[]): LogEvent[] {
  const merged = new Map<string, LogEvent[]>();
  for (const e of events) {
    if (e.log_name !== "balance_change") continue;
    const key = `${e.tx_id}:${e.subject_id}`;
    const list = merged.get(key);
    if (list) list.push(e);
    else merged.set(key, [e]);
  }

  const out: LogEvent[] = [];
  const emitted = new Set<string>();
  for (const e of events) {
    if (e.log_name !== "balance_change") {
      out.push(e);
      continue;
    }
    const key = `${e.tx_id}:${e.subject_id}`;
    if (emitted.has(key)) continue;
    emitted.add(key);
    const rows = merged.get(key) as LogEvent[];
    if (rows.length === 1) {
      out.push(e);
      continue;
    }
    const changes: Record<string, [unknown, unknown]> = {};
    // Oldest first, so the fields read in the order they were written.
    for (const r of [...rows].reverse()) {
      const d = r.detail ?? {};
      if (typeof d.field === "string") changes[d.field] = [d.before, d.after];
    }
    const base = rows.find((r) => r.detail?.field === "balance") ?? rows[0];
    out.push({
      ...base,
      // Newest of the merged rows, so the table order stays the same.
      occurred_at: rows[0].occurred_at,
      detail: { balance_table: base.detail?.balance_table, changes },
    });
  }
  return out;
}

/** True when `next` (older) belongs to the same user action as `prev`. */
function sameAction(prev: LogEvent, next: LogEvent) {
  if (prev.tx_id === next.tx_id) return true;
  return (
    prev.actor_id !== null &&
    prev.actor_id === next.actor_id &&
    prev.project_id === next.project_id &&
    time(prev) - time(next) <= SAME_ACTION_GAP_MS
  );
}

/**
 * Newest-first events → one row per user action. The row shows the event
 * the person actually made (the oldest that is not a balance change: the
 * expense, the payment…) and carries the rest in `related`, newest first.
 */
export function groupOperations(events: LogEvent[]): ActivityRow[] {
  const rows: ActivityRow[] = [];
  let run: LogEvent[] = [];

  const flush = () => {
    if (run.length === 1) {
      rows.push(run[0]);
    } else if (run.length > 1) {
      const oldestFirst = [...run].reverse();
      const lead = oldestFirst.find((e) => e.log_name !== "balance_change") ?? oldestFirst[0];
      rows.push({ ...lead, related: run.filter((e) => e !== lead) });
    }
    run = [];
  };

  for (const e of events) {
    const prev = run[run.length - 1];
    if (prev && !sameAction(prev, e)) flush();
    run.push(e);
  }
  flush();
  return rows;
}
