import { useRef, useState } from "react";
import CalendarPopover from "../board/CalendarPopover";
import DayOffsetPopover from "../board/DayOffsetPopover";
import { formatSlashDate } from "../board/taskDates";
import { dateToDayOffset, dayOffsetLabel } from "../board/templateDates";
import { useTemplateMode } from "../TemplateModeContext";

// A start/due date column cell in the Gantt's left panel (TaskGantt.tsx).
//
// Unlike the list view's DateCell / StartDateCell — which show a relative
// pill ("خلال 3 يوم", "منذ 5 يوم") — this shows the plain date, since the
// column sits right next to a timeline and is there to be read against it.
// Editing is the same popover the list uses (CalendarPopover, or
// DayOffsetPopover on a template board, where a date means "Day N"), so
// a date picked here moves the bar exactly like a drag does.
interface GanttDateCellProps {
  value: string | null;
  onChange: (date: string | null) => void;
  /** Red text — the end-date cell of a task with tasks.is_overdue set. */
  overdue?: boolean;
}

export default function GanttDateCell({ value, onChange, overdue = false }: GanttDateCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTemplate = useTemplateMode();

  const label = value ? (isTemplate ? dayOffsetLabel(dateToDayOffset(value)) : formatSlashDate(value)) : "—";

  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs hover:bg-gray-100 ${
          !value ? "text-gray-300" : overdue ? "font-medium text-red-600" : "text-gray-600"
        }`}
      >
        {label}
      </button>
      {open &&
        (isTemplate ? (
          <DayOffsetPopover value={value} onChange={onChange} onClose={() => setOpen(false)} anchorRef={ref} />
        ) : (
          <CalendarPopover value={value} onChange={onChange} onClose={() => setOpen(false)} anchorRef={ref} />
        ))}
    </div>
  );
}
