import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
const MONTH_LABELS = [
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
}

export default function CalendarPopover({ value, onChange, onClose, anchorRef, align = "right" }: CalendarPopoverProps) {
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
  const [viewYear, setViewYear] = useState(parsedValue?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedValue?.month ?? today.getMonth());
  // Friday is the weekend day here — picking one is usually a mistake, so
  // it goes through this inline confirm strip instead of committing
  // straight away, same "are you sure" posture as this app's confirm()
  // dialogs elsewhere, just non-blocking to match this popover's own
  // hand-rolled look instead of a native browser dialog.
  const [pendingFriday, setPendingFriday] = useState<string | null>(null);

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const goPrevMonth = () => {
    setPendingFriday(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const goNextMonth = () => {
    setPendingFriday(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const trySelect = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (new Date(y, m - 1, d).getDay() === 5) {
      setPendingFriday(iso);
      return;
    }
    onChange(iso);
    onClose();
  };

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
        {cells.map((day, i) =>
          day === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => trySelect(toISO(viewYear, viewMonth, day))}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                valueISO === toISO(viewYear, viewMonth, day)
                  ? "bg-primary font-medium text-white"
                  : toISO(viewYear, viewMonth, day) === todayISO
                    ? "font-semibold text-primary hover:bg-primary-superLight"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          ),
        )}
      </div>

      {pendingFriday && (
        <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            هذا يوم الجمعة، هل أنت متأكد؟
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onChange(pendingFriday);
                setPendingFriday(null);
                onClose();
              }}
              className="rounded-md bg-amber-600 px-2 py-1 font-medium text-white hover:bg-amber-700"
            >
              نعم، تأكيد
            </button>
            <button
              onClick={() => setPendingFriday(null)}
              className="rounded-md border border-amber-300 px-2 py-1 text-amber-700 hover:bg-amber-100"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5">
        <button
          onClick={() => {
            setViewYear(today.getFullYear());
            setViewMonth(today.getMonth());
            trySelect(todayISO);
          }}
          className="text-xs text-primary hover:underline"
        >
          اليوم
        </button>
        {value && (
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
