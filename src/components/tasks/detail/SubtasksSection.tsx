import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import type { StatusRow } from "../../../hooks/tasks/useTaskBoard";

interface SubtasksSectionProps {
  boardId: string;
  subtasks: { id: string; title: string; status: StatusRow | null }[];
  onAdd: (title: string) => void;
}

// Real subtasks (a status, a place in the dependency graph) — separate
// from checklists (ChecklistsSection.tsx), per build plan §4.10. Opening
// one swaps the panel to that subtask (same slide-over, new task id) —
// ClickUp stacks panels; this repo's router-driven panel does not, which
// is a deliberate simplification (see build plan D3 note).
export default function SubtasksSection({ boardId, subtasks, onAdd }: SubtasksSectionProps) {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");

  const submit = () => {
    const title = newTitle.trim();
    if (!title) return;
    onAdd(title);
    setNewTitle("");
  };

  return (
    <div className="space-y-1">
      {subtasks.map((st) => (
        <button
          key={st.id}
          onClick={() => navigate(`/tasks/board/${boardId}/task/${st.id}`)}
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

      <div className="flex items-center gap-1.5 px-2">
        <Plus className="h-3.5 w-3.5 text-gray-300" />
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onBlur={submit}
          placeholder="إضافة مهمة فرعية..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
