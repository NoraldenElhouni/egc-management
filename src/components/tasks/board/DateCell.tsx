import { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import CalendarPopover from "./CalendarPopover";
import Tooltip from "../../ui/Tooltip";

// Relative badge, red if overdue, amber if due soon — clickup-task-ui
// skill's "Date cell" rule. `isOverdue` comes from tasks.is_overdue
// (maintained by the recompute_overdue_flags cron job, build plan §5.6)
// rather than being recomputed here. The exact date shows on hover via
// Tooltip (not title="", which waits out the browser's hover delay).
function relativeLabel(dueDate: string): string {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "غداً";
  if (diffDays === -1) return "أمس";
  if (diffDays > 1) return `خلال ${diffDays} يوم`;
  return `متأخر ${Math.abs(diffDays)} يوم`;
}

// "2026/1/1" — plain numeric, no leading zeros.
function formatSlashDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

interface DateCellProps {
  dueDate: string | null;
  isOverdue: boolean;
  onChange: (date: string | null) => void;
  /** See StatusCell's align prop — "left" for narrow contexts near the
   * screen's left edge (the D3 detail panel). */
  align?: "left" | "right";
}

export default function DateCell({ dueDate, isOverdue, onChange, align = "right" }: DateCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const dueSoon = !!dueDate && !isOverdue && new Date(dueDate).getTime() - Date.now() < 2 * 86_400_000;

  return (
    <div ref={ref} className="relative">
      {dueDate ? (
        <Tooltip label={formatSlashDate(dueDate)}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
              isOverdue
                ? "bg-red-50 text-red-600"
                : dueSoon
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-50 text-gray-500"
            }`}
          >
            {relativeLabel(dueDate)}
          </button>
        </Tooltip>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
          title="تحديد تاريخ الاستحقاق"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      )}

      {open && <CalendarPopover value={dueDate} onChange={onChange} onClose={() => setOpen(false)} anchorRef={ref} align={align} />}
    </div>
  );
}
