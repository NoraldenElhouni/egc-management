// Working-day maths for task scheduling — the client's copy of the SQL in
// tasks/migrations/2026-10-13_task_scheduling_a.sql (tasks.is_off_day,
// working_day_on_or_after, next_working_day, add_working_days,
// working_days_between). The server is the source of truth: these exist so
// the create dialog, the days ⇄ due fields and the Gantt drag can show the
// result instantly; whatever the server returns replaces it.
//
// Dates are plain "YYYY-MM-DD" strings (a task's start/due is stored as
// 00:00 UTC of that day), handled as UTC day numbers so the device's
// timezone never shifts a day. Friday is the only day off; isOffDay is the
// one place that says so.

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" (or a full timestamptz string) → days since 1970-01-01. */
export function dayNumber(value: string): number {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Days since 1970-01-01 → "YYYY-MM-DD". */
export function dayString(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Sunday … 5 = Friday, 6 = Saturday. */
export function weekdayOf(day: number): number {
  return (((day + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

export function isOffDay(day: number): boolean {
  return weekdayOf(day) === 5;
}

export function workingDayOnOrAfter(day: number): number {
  let d = day;
  while (isOffDay(d)) d += 1;
  return d;
}

export function nextWorkingDay(day: number): number {
  return workingDayOnOrAfter(day + 1);
}

/** The n-th working day, counting the first working day on or after `start` as day 1. */
export function addWorkingDays(start: number, n: number): number {
  let d = workingDayOnOrAfter(start);
  let left = Math.max(1, Math.floor(n)) - 1;
  while (left > 0) {
    d += 1;
    if (!isOffDay(d)) left -= 1;
  }
  return d;
}

/** Working days from `from` to `to`, both included; 0 when `to` is before `from`. */
export function workingDaysBetween(from: number, to: number): number {
  let count = 0;
  for (let d = from; d <= to; d++) if (!isOffDay(d)) count += 1;
  return count;
}

// ---- string versions, for the dialog and the cells ----------------------

export function dueFromDays(start: string, days: number): string {
  return dayString(addWorkingDays(dayNumber(start), days));
}

export function daysFromDue(start: string, due: string): number {
  return Math.max(1, workingDaysBetween(dayNumber(start), dayNumber(due)));
}

export function isFriday(value: string): boolean {
  return isOffDay(dayNumber(value));
}

/** Today in Libya, as the server's tasks.local_today() sees it. */
export function localToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tripoli",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}

export function workingDayOnOrAfterString(value: string): string {
  return dayString(workingDayOnOrAfter(dayNumber(value)));
}

export function nextWorkingDayString(value: string): string {
  return dayString(nextWorkingDay(dayNumber(value)));
}

const WEEKDAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** "الخميس 2026/10/22" */
export function formatDayWithWeekday(value: string): string {
  const day = dayNumber(value);
  const [y, m, d] = dayString(day).split("-").map(Number);
  return `${WEEKDAY_NAMES[weekdayOf(day)]} ${y}/${m}/${d}`;
}

/** "يوم عمل" / "يوما عمل" / "3 أيام عمل" / "12 يوم عمل" */
export function workingDaysLabel(n: number): string {
  if (n === 1) return "يوم عمل";
  if (n === 2) return "يوما عمل";
  return n <= 10 ? `${n} أيام عمل` : `${n} يوم عمل`;
}
