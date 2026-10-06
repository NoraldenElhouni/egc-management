import type { TaskRow, TaskTypeLite } from "../../../hooks/tasks/useTaskBoard";
import { MONTH_LABELS } from "../board/CalendarPopover";
import { toLocalDateInput } from "../board/taskDates";
import { dateToDayOffset, dayOffsetLabel, dayOffsetToDate } from "../board/templateDates";

// Pure layout math for the Gantt view (TaskGantt.tsx) — no React here.
//
// Everything on the chart is placed on an integer "day index", never on
// raw timestamps, so a bar always covers whole days and a drag always
// snaps to one. Two adapters map stored values to that index:
//
//   - calendar boards: the LOCAL calendar day a value falls on (taskDates.ts
//     house rule — local Y/M/D, never toISOString().split), numbered as
//     days since 1970-01-01. Written back as "YYYY-MM-DD" via
//     toLocalDateInput, the same shape CalendarPopover writes.
//   - template boards: Day N (templateDates.ts), written back via
//     dayOffsetToDate — so a template's Gantt drags land on the same
//     Day N cells its list view shows.

const DAY_MS = 86_400_000;

export type GanttZoom = "day" | "week" | "month";

// A week is 112px and a month ~180px — wide enough for the header labels
// and for short tasks to stay visible bars rather than slivers.
export const ZOOM_PX_PER_DAY: Record<GanttZoom, number> = {
  day: 36,
  week: 16,
  month: 6,
};

/** Scroll-zoom limits. At 2px/day a month is still 60px — enough for its
 * header label — and at 80px/day a day cell is wide enough for any bar. */
export const MIN_PX_PER_DAY = 2;
export const MAX_PX_PER_DAY = 80;

/** Which header (day / week / month cells) a continuous zoom level uses.
 * Scroll-zoom moves pxPerDay smoothly; the header switches granularity at
 * these thresholds, picked so the cells' labels always fit: a day cell
 * (>= 24px) holds a two-digit date, a week cell (>= 63px) its "4 – 10"
 * range, a month cell (>= 60px) its name. The three presets above sit
 * comfortably inside their own band. */
export function zoomForPxPerDay(px: number): GanttZoom {
  if (px >= 24) return "day";
  if (px >= 9) return "week";
  return "month";
}

export const ZOOM_LABELS: Record<GanttZoom, string> = {
  day: "يوم",
  week: "أسبوع",
  month: "شهر",
};

export interface DayAdapter {
  isTemplate: boolean;
  /** Stored DB value (timestamptz or "YYYY-MM-DD") → day index. */
  toDay(value: string): number;
  /** Day index → the "YYYY-MM-DD" string the date mutations write. */
  fromDay(day: number): string;
  /** Today's index — null on a template board, which has no "today". */
  today: number | null;
}

/** Local calendar day of `d` as days since 1970-01-01. Date.UTC on the
 * LOCAL parts, so the result is a pure calendar number that no timezone
 * or DST shift can move. */
function calendarDayOf(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** Inverse of calendarDayOf, as plain parts (UTC getters on purpose: the
 * index was built from Date.UTC, so reading it back in UTC is exact). */
function calendarParts(day: number): { year: number; month: number; date: number; weekday: number } {
  const d = new Date(day * DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate(), weekday: d.getUTCDay() };
}

export function dayAdapter(isTemplate: boolean): DayAdapter {
  if (isTemplate) {
    return {
      isTemplate,
      toDay: dateToDayOffset,
      fromDay: dayOffsetToDate,
      today: null,
    };
  }
  return {
    isTemplate,
    toDay: (value) => calendarDayOf(new Date(value)),
    fromDay: (day) => {
      const { year, month, date } = calendarParts(day);
      return toLocalDateInput(new Date(year, month, date));
    },
    today: calendarDayOf(new Date()),
  };
}

// ---------------------------------------------------------------------------
// Bars

export type BarKind = "range" | "milestone" | "none";

export interface BarSpan {
  kind: BarKind;
  /** Inclusive day range. A milestone has startDay === endDay. */
  startDay: number;
  endDay: number;
  /** Which DB columns actually hold a value — a drag only writes these
   * (plus whichever edge was explicitly resized). */
  hasStart: boolean;
  hasDue: boolean;
}

const NO_SPAN: BarSpan = { kind: "none", startDay: 0, endDay: 0, hasStart: false, hasDue: false };

/** Where a task's bar sits. One date only → a single-day bar on it. A
 * milestone-type task (task_types.name, never the Arabic label) is a
 * single-date diamond at its due date, else its start date (build plan
 * §4.6). */
export function barSpan(
  task: TaskRow,
  taskTypes: ReadonlyMap<string, TaskTypeLite>,
  adapter: DayAdapter,
): BarSpan {
  const hasStart = !!task.start_date;
  const hasDue = !!task.due_date;
  if (!hasStart && !hasDue) return NO_SPAN;

  const startDay = task.start_date ? adapter.toDay(task.start_date) : null;
  const dueDay = task.due_date ? adapter.toDay(task.due_date) : null;

  const isMilestone = !!task.task_type_id && taskTypes.get(task.task_type_id)?.name === "milestone";
  if (isMilestone) {
    const day = (dueDay ?? startDay) as number;
    return { kind: "milestone", startDay: day, endDay: day, hasStart, hasDue };
  }

  const s = startDay ?? (dueDay as number);
  const e = dueDay ?? (startDay as number);
  // A start after the due date isn't prevented by the DB — draw it as
  // the range it spans rather than a negative-width bar.
  return { kind: "range", startDay: Math.min(s, e), endDay: Math.max(s, e), hasStart, hasDue };
}

// ---------------------------------------------------------------------------
// Visible range

export interface DayRange {
  /** Inclusive. */
  startDay: number;
  endDay: number;
}

const PAD_BEFORE = 7;
const PAD_AFTER = 14;
const EMPTY_SPAN_AFTER = 30;

/** Earliest bar (or today / Day 0) minus a week, to the latest bar plus two
 * weeks — and always at least a month past the anchor, so a nearly empty
 * board still has room to drop dates onto. */
export function computeRange(spans: BarSpan[], adapter: DayAdapter): DayRange {
  const anchor = adapter.today ?? 0;
  let min = anchor;
  let max = anchor;
  for (const s of spans) {
    if (s.kind === "none") continue;
    if (s.startDay < min) min = s.startDay;
    if (s.endDay > max) max = s.endDay;
  }
  return {
    startDay: min - PAD_BEFORE,
    endDay: Math.max(max + PAD_AFTER, anchor + EMPTY_SPAN_AFTER),
  };
}

/** Bottom-row period length on a template board (Day N blocks from Day 0). */
const TEMPLATE_PERIOD: Record<GanttZoom, number> = { day: 1, week: 7, month: 30 };

const floorTo = (day: number, size: number) => Math.floor(day / size) * size;

/** First day of the bottom-row period (day / week / month) `day` is in. */
function periodStart(day: number, zoom: GanttZoom, adapter: DayAdapter): number {
  if (adapter.isTemplate) return floorTo(day, TEMPLATE_PERIOD[zoom]);
  // Weeks start on Sunday, like CalendarPopover's grid.
  if (zoom === "week") return day - calendarParts(day).weekday;
  if (zoom === "month") {
    const p = calendarParts(day);
    return Math.round(Date.UTC(p.year, p.month, 1) / DAY_MS);
  }
  return day;
}

/** First day of the period after the one `day` is in. */
function nextPeriodStart(day: number, zoom: GanttZoom, adapter: DayAdapter): number {
  if (adapter.isTemplate) return floorTo(day, TEMPLATE_PERIOD[zoom]) + TEMPLATE_PERIOD[zoom];
  if (zoom === "week") return periodStart(day, zoom, adapter) + 7;
  if (zoom === "month") {
    const p = calendarParts(day);
    return Math.round(Date.UTC(p.year, p.month + 1, 1) / DAY_MS);
  }
  return day + 1;
}

/** Snap a range to whole header periods (no half-week / half-month cell at
 * either edge) and stretch it to at least `minDays`, so the chart fills
 * the screen instead of stopping short with blank space past its end —
 * at week/month zoom a typical board's dates otherwise cover only part
 * of the width. */
export function fitRange(range: DayRange, zoom: GanttZoom, adapter: DayAdapter, minDays: number): DayRange {
  const startDay = periodStart(range.startDay, zoom, adapter);
  const wantedEnd = Math.max(range.endDay, startDay + minDays - 1);
  return { startDay, endDay: nextPeriodStart(wantedEnd, zoom, adapter) - 1 };
}

/** Fri/Sat days in the range, for shading in day and week zoom. Not in
 * month zoom (a 6px day stripe reads as noise), and not on template
 * boards, which have no weekdays. */
export function weekendDays(range: DayRange, zoom: GanttZoom, adapter: DayAdapter): number[] {
  if (adapter.isTemplate || zoom === "month") return [];
  const days: number[] = [];
  for (let day = range.startDay; day <= range.endDay; day++) {
    if (isWeekend(calendarParts(day).weekday)) days.push(day);
  }
  return days;
}

// ---------------------------------------------------------------------------
// Header

export interface HeaderCell {
  /** Inclusive start, exclusive end — clipped to the visible range. */
  startDay: number;
  endDay: number;
  label: string;
  /** Fri/Sat in day zoom — shaded in the header. */
  weekend?: boolean;
}

export interface HeaderRows {
  top: HeaderCell[];
  bottom: HeaderCell[];
}

/** Split [range.startDay, range.endDay] into consecutive cells, starting a
 * new one wherever `keyOf` changes. */
function segment(range: DayRange, keyOf: (day: number) => string, labelOf: (day: number) => string): HeaderCell[] {
  const cells: HeaderCell[] = [];
  let current: HeaderCell | null = null;
  let currentKey = "";
  for (let day = range.startDay; day <= range.endDay; day++) {
    const key = keyOf(day);
    if (!current || key !== currentKey) {
      if (current) cells.push(current);
      current = { startDay: day, endDay: day + 1, label: labelOf(day) };
      currentKey = key;
    } else {
      current.endDay = day + 1;
    }
  }
  if (current) cells.push(current);
  return cells;
}

/** Fri (5) and Sat (6) — Libya's weekend. */
function isWeekend(weekday: number): boolean {
  return weekday === 5 || weekday === 6;
}

function calendarHeader(range: DayRange, zoom: GanttZoom): HeaderRows {
  const monthKey = (day: number) => {
    const p = calendarParts(day);
    return `${p.year}-${p.month}`;
  };
  const monthLabel = (day: number) => {
    const p = calendarParts(day);
    return `${MONTH_LABELS[p.month]} ${p.year}`;
  };

  if (zoom === "month") {
    return {
      top: segment(range, (d) => String(calendarParts(d).year), (d) => String(calendarParts(d).year)),
      bottom: segment(range, monthKey, (d) => MONTH_LABELS[calendarParts(d).month]),
    };
  }

  const top = segment(range, monthKey, monthLabel);

  if (zoom === "week") {
    // "4 – 10": the week's first and last day — the month is in the row
    // above. In the RTL header the first day reads first (rightmost).
    const weekStart = (day: number) => day - calendarParts(day).weekday;
    return {
      top,
      bottom: segment(
        range,
        (d) => String(weekStart(d)),
        (d) => `${calendarParts(weekStart(d)).date} – ${calendarParts(weekStart(d) + 6).date}`,
      ),
    };
  }

  const bottom: HeaderCell[] = [];
  for (let day = range.startDay; day <= range.endDay; day++) {
    const p = calendarParts(day);
    bottom.push({ startDay: day, endDay: day + 1, label: String(p.date), weekend: isWeekend(p.weekday) });
  }
  return { top, bottom };
}

/** Template boards have no calendar — just Day N, grouped in fixed-size
 * blocks counted from Day 0. */
function templateHeader(range: DayRange, zoom: GanttZoom): HeaderRows {
  const topSize = zoom === "day" ? 7 : zoom === "week" ? 28 : 90;
  const bottomSize = TEMPLATE_PERIOD[zoom];
  return {
    top: segment(
      range,
      (d) => String(floorTo(d, topSize)),
      (d) =>
        zoom === "day"
          ? `الأسبوع ${Math.floor(d / 7) + 1}`
          : dayOffsetLabel(floorTo(d, topSize)),
    ),
    bottom: segment(
      range,
      (d) => String(floorTo(d, bottomSize)),
      (d) => (zoom === "day" ? String(d) : dayOffsetLabel(floorTo(d, bottomSize))),
    ),
  };
}

export function headerRows(range: DayRange, zoom: GanttZoom, adapter: DayAdapter): HeaderRows {
  return adapter.isTemplate ? templateHeader(range, zoom) : calendarHeader(range, zoom);
}

/** Tooltip text for a bar: "من 2026/1/5 إلى 2026/1/9" / "من يوم 3 إلى يوم 7".
 * Words rather than an arrow: the tooltip is portaled outside the page's
 * dir="rtl", and an arrow between two dates reads backwards in one of the
 * two directions. */
export function spanLabel(startDay: number, endDay: number, adapter: DayAdapter): string {
  const fmt = (day: number) => {
    if (adapter.isTemplate) return dayOffsetLabel(day);
    const p = calendarParts(day);
    return `${p.year}/${p.month + 1}/${p.date}`;
  };
  return startDay === endDay ? fmt(startDay) : `من ${fmt(startDay)} إلى ${fmt(endDay)}`;
}
