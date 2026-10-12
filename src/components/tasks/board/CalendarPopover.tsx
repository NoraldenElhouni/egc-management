import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";

// Shared month-grid calendar, opened by both DateCell (due date) and
// StartDateCell (start date) instead of a bare native <input type="date">
// — same small-popover posture as every other board cell (StatusCell,
// PriorityCell, ...), just no library since the app doesn't have one.
// Dates are plain "YYYY-MM-DD" strings built from local Y/M/D, never
// toISOString() (which is UTC and can shift the day near midnight).
//
// Portaled to document.body instead of a plain absolute-positioned child
// of the trigger (every other board popover's approach): the first task
// row sits right under the board's sticky column header, and this
// popover — much taller than a status/priority dropdown — was rendering
// underneath that header for that row regardless of z-index. Portaling
// sidesteps the trigger's stacking context entirely; position is instead
// computed from the trigger's own screen rect via anchorRef. Click-outside
// now has to check both the trigger and this portaled node explicitly,
// since the portaled DOM is no longer a descendant of the trigger's ref.

const POPOVER_WIDTH = 256; // w-64

const WEEKDAY_LABELS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
// Exported for the Gantt view's month header (gantt/ganttScale.ts).
export const MONTH_LABELS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// `value` comes straight from the DB — for a timestamptz column that's a
// full "2024-01-15T00:00:00+00:00" string, not bare "YYYY-MM-DD", so this
// goes through the Date constructor (handles both shapes) rather than
// splitting on "-" (which used to read the "15T00:00:00+00:00" chunk as
// the day, Number()-ed it to NaN, and produced "Invalid Date" everywhere
// this popover used the result).
function parseDateValue(value: string): { year: number; month: number; day: number } {
  const d = new Date(value);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

interface CalendarPopoverProps {
  value: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
  /** The trigger button's own ref — used both to compute where to anchor
   * this portaled popover on screen, and (alongside this popover's own
   * node) to decide what counts as "inside" for click-outside. */
  anchorRef: RefObject<HTMLElement | null>;
  /** See StatusCell's align prop — "left" for narrow contexts near the
   * screen's left edge (the D3 detail panel). */
  align?: "left" | "right";
  /** "YYYY-MM-DD" (or a timestamptz string): days before it can't be
   * picked — a linked task can't start before its predecessors end, a due
   * date can't come before the start. */
  minDate?: string | null;
  /** Show "إزالة التاريخ". A scheduled task's dates can't be cleared. */
  allowClear?: boolean;
  /** One more footer action, e.g. "إلغاء الانتظار" on a linked task's start. */
  extraAction?: { label: string; onClick: () => void };
}

export default function CalendarPopover({
  value,
  onChange,
  onClose,
  anchorRef,
  align = "right",
  minDate = null,
  allowClear = true,
  extraAction,
}: CalendarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useClickOutside([anchorRef, popoverRef], onClose);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: align === "left" ? rect.left : rect.right - POPOVER_WIDTH,
    });
  }, [anchorRef, align]);

  // Clamp back inside the viewport once the popover has actually
  // rendered and has a real size — the pass above only knows the
  // trigger's own position, not this popover's height, so a trigger near
  // the bottom or an edge of a long list (ProjectView/AssigneeView's
  // directory tables especially, where a row can sit anywhere on a tall
  // scrolled page) could otherwise open this partly or fully off-screen.
  // Depends on `pos` itself so it re-measures after the pass above (and
  // after its own correction below); it only calls setPos when a
  // correction is actually needed, so this settles after one extra pass
  // instead of looping.
  useLayoutEffect(() => {
    if (!pos) return;
    const popover = popoverRef.current;
    if (!popover) return;

    const rect = popover.getBoundingClientRect();
    const margin = 8;
    let top = pos.top;
    let left = pos.left;

    if (rect.bottom > window.innerHeight - margin) {
      const anchor = anchorRef.current;
      const above = anchor ? anchor.getBoundingClientRect().top - rect.height - 4 : top;
      top = above >= margin ? above : Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (rect.left < margin) {
      left = margin;
    } else if (rect.right > window.innerWidth - margin) {
      left = window.innerWidth - rect.width - margin;
    }

    if (top !== pos.top || left !== pos.left) {
      setPos({ top, left });
    }
  }, [pos, anchorRef]);

  const today = new Date();
  const parsedValue = value ? parseDateValue(value) : null;
  // Normalized "YYYY-MM-DD" for the incoming value — comparisons below use
  // this instead of the raw `value` prop, since that can be timestamp-
  // shaped and would never string-equal a plain toISO() result.
  const valueISO = parsedValue ? toISO(parsedValue.year, parsedValue.month, parsedValue.day) : null;
  const parsedMin = minDate ? parseDateValue(minDate) : null;
  const minISO = parsedMin ? toISO(parsedMin.year, parsedMin.month, parsedMin.day) : null;
  const [viewYear, setViewYear] = useState(parsedValue?.year ?? parsedMin?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedValue?.month ?? parsedMin?.month ?? today.getMonth());

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Friday is the only day off (workingDays.ts): no task starts or ends on
  // one, so it can't be picked at all — the server would move it anyway.
  const isFridayISO = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 5;
  };
  const isDisabled = (iso: string) => isFridayISO(iso) || (!!minISO && iso < minISO);

  const select = (iso: string) => {
    if (isDisabled(iso)) return;
    onChange(iso);
    onClose();
  };

  // "اليوم", or the first day that can be picked from today on.
  const firstPickable = (() => {
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (let i = 0; i < 400; i++) {
      const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
      if (!isDisabled(iso)) return iso;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return todayISO;
  })();

  if (!pos) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
      className="z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <button onClick={goPrevMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="الشهر السابق">
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button onClick={goNextMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="الشهر التالي">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="flex h-6 items-center justify-center text-[10px] font-medium text-gray-400">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toISO(viewYear, viewMonth, day);
          const disabled = isDisabled(iso);
          return (
            <button
              key={i}
              onClick={() => select(iso)}
              disabled={disabled}
              title={isFridayISO(iso) ? "الجمعة عطلة" : disabled ? "قبل أول تاريخ مسموح" : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                valueISO === iso
                  ? "bg-primary font-medium text-white"
                  : disabled
                    ? "cursor-not-allowed text-gray-300 line-through decoration-gray-200"
                    : iso === todayISO
                      ? "font-semibold text-primary hover:bg-primary-superLight"
                      : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5">
        <button
          onClick={() => {
            const [y, m] = firstPickable.split("-").map(Number);
            setViewYear(y);
            setViewMonth(m - 1);
            select(firstPickable);
          }}
          className="text-xs text-primary hover:underline"
        >
          {firstPickable === todayISO ? "اليوم" : "أقرب يوم متاح"}
        </button>
        {extraAction && (
          <button
            onClick={() => {
              extraAction.onClick();
              onClose();
            }}
            className="text-xs text-amber-600 hover:underline"
          >
            {extraAction.label}
          </button>
        )}
        {value && allowClear && (
          <button
            onClick={() => {
              onChange(null);
              onClose();
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            إزالة التاريخ
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
