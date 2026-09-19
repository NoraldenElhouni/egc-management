import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import CalendarPopover from "./CalendarPopover";
import Tooltip from "../../ui/Tooltip";

// Same popover as DateCell (due date), but no overdue/soon coloring —
// a start date is neutral, there's no "late" concept for it. The pill
// shows days-since-start (DateCell's relativeLabel, mirrored for a start
// date instead of a due date) with the exact date on hover via Tooltip
// (not a title="", which waits out the browser's hover delay — see
// Tooltip.tsx), rather than the date itself — parsed via the Date
// constructor, not a manual "YYYY-MM-DD".split("-"), since a timestamptz
// column can hand back a full "...T00:00:00+00:00" string that split()
// can't read as a plain date (that used to produce NaN → "Invalid Date").
function daysPassedLabel(startDate: string): string {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays === -1) return "غداً";
  if (diffDays > 1) return `منذ ${diffDays} يوم`;
  return `يبدأ خلال ${Math.abs(diffDays)} يوم`;
}

// "2026/1/1" — plain numeric, no leading zeros.
function formatSlashDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

interface StartDateCellProps {
  startDate: string | null;
  onChange: (date: string | null) => void;
  /** See StatusCell's align prop — "left" for narrow contexts near the
   * screen's left edge (the D3 detail panel). */
  align?: "left" | "right";
}

export default function StartDateCell({ startDate, onChange, align = "right" }: StartDateCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      {startDate ? (
        <Tooltip label={formatSlashDate(startDate)}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="whitespace-nowrap rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            {daysPassedLabel(startDate)}
          </button>
        </Tooltip>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
          title="تحديد تاريخ البدء"
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </button>
      )}

      {open && <CalendarPopover value={startDate} onChange={onChange} onClose={() => setOpen(false)} anchorRef={ref} align={align} />}
    </div>
  );
}
