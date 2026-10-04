import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import { dateToDayOffset, dayOffsetToDate } from "./templateDates";

// CalendarPopover's stand-in on template boards: a template has no real
// dates, only "Day N" offsets from whenever it gets applied (see
// templateDates.ts). Portaled and anchored the same way as
// CalendarPopover, for the same sticky-header reason.

const POPOVER_WIDTH = 192; // w-48

interface DayOffsetPopoverProps {
  value: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: "left" | "right";
}

export default function DayOffsetPopover({ value, onChange, onClose, anchorRef, align = "right" }: DayOffsetPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [draft, setDraft] = useState(value ? String(dateToDayOffset(value)) : "");
  useClickOutside([anchorRef, popoverRef], onClose);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const left = align === "left" ? rect.left : rect.right - POPOVER_WIDTH;
    setPos({
      top: Math.min(rect.bottom + 4, window.innerHeight - 120),
      left: Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8)),
    });
  }, [anchorRef, align]);

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(n)) return;
    onChange(dayOffsetToDate(n));
    onClose();
  };

  if (!pos) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
      className="z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
      dir="rtl"
    >
      <label className="mb-1 block text-xs text-gray-500">اليوم من بداية التطبيق</label>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-gray-500">يوم</span>
        <input
          autoFocus
          type="number"
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-primary"
        />
        <button onClick={commit} className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-white">
          حفظ
        </button>
      </div>
      {value && (
        <button
          onClick={() => {
            onChange(null);
            onClose();
          }}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          إزالة التاريخ
        </button>
      )}
    </div>,
    document.body,
  );
}
