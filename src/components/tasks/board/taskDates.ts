// Shared date helpers for the task board / directory cells.
//
// House rule, also stated at the top of CalendarPopover.tsx: calendar
// dates are built from LOCAL year/month/day, never
// `toISOString().split("T")[0]`. Libya is UTC+2 with no DST, so the UTC
// pattern returns *yesterday* between 00:00 and 02:00 local — the bug the
// codebase audit records at 17 sites in this app
// (plans/codebase-audit/04-bugs-and-risks.md §10).
//
// The distinction that matters: serialising an *instant* with
// toISOString() is fine. Extracting a *calendar date* from it is not.
// Everything here compares instants against locally-computed day
// boundaries, so the pitfall never arises.

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2:30 م" / "9:05 ص" — 12-hour, Arabic ص/م, Latin numerals.
 *
 * Hand-rolled rather than toLocaleTimeString("ar-LY") on purpose: that
 * returns Arabic-Indic numerals (٢:٣٠), which would clash with the Latin
 * digits formatSlashDate() produces right next to it. The codebase audit
 * already records this app mixing four different locale spellings across
 * 21 sites; this keeps date and time in one script at least here.
 *
 * The hour is not zero-padded — "9:05 ص", not "09:05 ص" — which is the
 * normal 12-hour convention. Minutes still are. */
function formatTime12(d: Date): string {
  const h24 = d.getHours();
  const meridiem = h24 < 12 ? "ص" : "م";
  // 0 → 12 ص (past midnight), 12 → 12 م (noon).
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(d.getMinutes())} ${meridiem}`;
}

/** The local day `d` falls in, minus the local day `now` falls in, in
 * whole days. Negative = in the past. */
function calendarDayDiff(d: Date, now: Date): number {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** Local midnight today → local midnight tomorrow, as a half-open range
 * of epoch milliseconds. */
export function localDayBounds(now: Date = new Date()): { start: number; end: number } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return {
    start: new Date(y, m, d).getTime(),
    // Date normalises an overflowing day-of-month, and does it in local
    // time — so this stays correct across a DST boundary, unlike
    // `start + 86_400_000`. Libya has no DST, but the device's timezone
    // is whatever the machine is set to, which may.
    end: new Date(y, m, d + 1).getTime(),
  };
}

/** True when `ts` falls inside today, in the device's local timezone.
 * Half-open: a timestamp at exactly local midnight belongs to the day
 * starting then, not the one ending. */
export function isCompletedToday(ts: string | null, now: Date = new Date()): boolean {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return false;
  const { start, end } = localDayBounds(now);
  return t >= start && t < end;
}

/** "2026/1/1" — plain numeric, no leading zeros. */
export function formatSlashDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** "2026/1/1 2:30 م" — the slash date plus a 12-hour local time. Used for
 * the exact-value tooltip on a completion badge. */
export function formatSlashDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${formatSlashDate(dateStr)} ${formatTime12(d)}`;
}

/** Badge text for a completion timestamp: "اليوم 2:30 م" / "أمس 9:05 ص",
 * otherwise the plain date. The time is worth showing for today and
 * yesterday — "which of these did I finish this morning" is the question
 * the completed-today filter exists to answer — and noise beyond that. */
export function completedLabel(ts: string, now: Date = new Date()): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const time = formatTime12(d);
  const dayDiff = calendarDayDiff(d, now);

  if (dayDiff === 0) return `اليوم ${time}`;
  if (dayDiff === -1) return `أمس ${time}`;
  return formatSlashDate(ts);
}
