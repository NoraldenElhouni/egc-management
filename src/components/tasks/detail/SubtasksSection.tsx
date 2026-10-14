import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import type { StatusRow } from "../../../hooks/tasks/useTaskBoard";

interface SubtasksSectionProps {
  basePath: string;
  subtasks: { id: string; title: string; status: StatusRow | null }[];
  /** A subtask needs a start and days, so "add" opens the create dialog. */
  onOpenAdd: () => void;
  /** May add subtasks (edit rights). Default true. */
  canAdd?: boolean;
}

// Real subtasks (a status, a place in the dependency graph) — separate
// from checklists (ChecklistsSection.tsx), per build plan §4.10. Opening
// one swaps the panel to that subtask (same slide-over, new task id) —
// ClickUp stacks panels; this repo's router-driven panel does not, which
// is a deliberate simplification (see build plan D3 note). basePath is
// whichever list (board/department/my-work) currently hosts the panel —
// see TaskDetailPanel's own header comment.
export default function SubtasksSection({ basePath, subtasks, onOpenAdd, canAdd = true }: SubtasksSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {subtasks.map((st) => (
        <button
          key={st.id}
          onClick={() => navigate(`${basePath}/task/${st.id}`)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-sm hover:bg-gray-50"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: st.status?.color ?? "#9CA3AF" }}
          />
          <span className="flex-1 truncate text-gray-700">{st.title}</span>
          <span className="shrink-0 text-xs text-gray-400">{st.status?.label_ar}</span>
        </button>
      ))}

      {canAdd && (
        <button
          onClick={onOpenAdd}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-right text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة مهمة فرعية
        </button>
      )}
    </div>
  );
}
