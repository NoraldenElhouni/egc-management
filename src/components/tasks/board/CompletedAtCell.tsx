import { CheckCircle2 } from "lucide-react";
import Tooltip from "../../ui/Tooltip";
import { completedLabel, formatSlashDateTime } from "./taskDates";

// Read-only, unlike every other cell in this row — tasks.completed_at is
// owned by the BEFORE INSERT/UPDATE trigger on tasks.tasks (build plan
// §5.2): it's stamped when status_id moves to a done-category status and
// cleared when it moves away. Writing it from the client would put the
// column out of step with the status that's supposed to define it, so
// there's no popover and no onChange here. To change it, change the
// status.
//
// Renders nothing when null. That's the normal case for an open task,
// and it's also what you see for a `closed`-category task (ملغي) — the
// trigger only stamps `done`, not `closed`.
interface CompletedAtCellProps {
  completedAt: string | null;
}

export default function CompletedAtCell({ completedAt }: CompletedAtCellProps) {
  if (!completedAt) return <div />;

  return (
    <div>
      <Tooltip label={formatSlashDateTime(completedAt)}>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          {completedLabel(completedAt)}
        </span>
      </Tooltip>
    </div>
  );
}
