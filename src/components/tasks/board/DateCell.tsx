import { useRef, useState } from "react";
import { Calendar } from "lucide-react";

// Relative badge, red if overdue, amber if due soon — clickup-task-ui
// skill's "Date cell" rule. `isOverdue` comes from tasks.is_overdue
// (maintained by the recompute_overdue_flags cron job, build plan §5.6)
// rather than being recomputed here.
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

interface DateCellProps {
  dueDate: string | null;
  isOverdue: boolean;
  onChange: (date: string | null) => void;
}

export default function DateCell({ dueDate, isOverdue, onChange }: DateCellProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        autoFocus
        defaultValue={dueDate ?? ""}
        onBlur={(e) => {
          onChange(e.target.value || null);
          setEditing(false);
        }}
        className="w-32 rounded-md border border-gray-300 px-1.5 py-0.5 text-xs outline-none"
      />
    );
  }

  if (!dueDate) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
        title="تحديد تاريخ الاستحقاق"
      >
        <Calendar className="h-3.5 w-3.5" />
      </button>
    );
  }

  const dueSoon =
    !isOverdue &&
    new Date(dueDate).getTime() - Date.now() < 2 * 86_400_000;

  return (
    <button
      onClick={() => setEditing(true)}
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
  );
}
