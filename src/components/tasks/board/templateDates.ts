// Template boards (boards.is_template) store their dates as plain
// timestamptz like every other board, but they mean "Day N" rather than a
// calendar date: Day N = tasks.template_epoch() (2000-01-01) + N days.
// tasks.apply_template_board() shifts them so the epoch lands on the
// anchor date the user picks when applying.
//
// Unlike taskDates.ts's local-calendar rule, the epoch math here is done
// in UTC on purpose: the DB stores Day N as midnight UTC, and an offset is
// a whole-day distance between two instants, not a local calendar date —
// so the device's timezone must not shift it.

const EPOCH_UTC = Date.UTC(2000, 0, 1);

/** "2000-01-04" for Day 3 — the shape the existing date mutations already
 * write (Postgres reads a bare date as midnight UTC). */
export function dayOffsetToDate(offset: number): string {
  const d = new Date(EPOCH_UTC + offset * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Day N of a stored template date. Rounded, so a value that was written
 * as a local calendar date (a few hours off midnight UTC) still lands on
 * the right day. */
export function dateToDayOffset(value: string): number {
  return Math.round((new Date(value).getTime() - EPOCH_UTC) / 86_400_000);
}

/** "يوم 3" / "يوم -2" */
export function dayOffsetLabel(offset: number): string {
  return `يوم ${offset}`;
}
