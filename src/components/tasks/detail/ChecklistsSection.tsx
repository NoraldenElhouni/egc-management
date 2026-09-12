import { useState } from "react";
import { Plus } from "lucide-react";
import type { Checklist, ChecklistItem } from "../../../hooks/tasks/useTaskDetail";

interface ChecklistsSectionProps {
  checklists: (Checklist & { items: ChecklistItem[] })[];
  onAddChecklist: (name: string) => void;
  onAddItem: (checklistId: string, content: string) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
}

function ChecklistBlock({
  checklist,
  onAddItem,
  onToggleItem,
}: {
  checklist: Checklist & { items: ChecklistItem[] };
  onAddItem: (checklistId: string, content: string) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const done = checklist.items.filter((i) => i.is_checked).length;

  const submit = () => {
    const content = newItem.trim();
    if (!content) return;
    onAddItem(checklist.id, content);
    setNewItem("");
  };

  return (
    <div className="rounded-lg border border-gray-100 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{checklist.name}</span>
        {checklist.items.length > 0 && (
          <span className="text-xs text-gray-400">
            {done}/{checklist.items.length}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={item.is_checked}
              onChange={(e) => onToggleItem(item.id, e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span className={item.is_checked ? "text-gray-400 line-through" : "text-gray-700"}>
              {item.content}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1.5 px-1">
        <Plus className="h-3.5 w-3.5 text-gray-300" />
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onBlur={submit}
          placeholder="إضافة عنصر..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

// "Subtasks: checklist-style list inside the panel, '+ add subtask'
// inline at the bottom of that list" (clickup-task-ui skill) — this
// component handles the literal checklists (4.10: lightweight, no status/
// due date), separate from real subtasks (SubtasksSection.tsx).
export default function ChecklistsSection({
  checklists,
  onAddChecklist,
  onAddItem,
  onToggleItem,
}: ChecklistsSectionProps) {
  const [newChecklistName, setNewChecklistName] = useState("");
  const [adding, setAdding] = useState(false);

  const submitNew = () => {
    const name = newChecklistName.trim();
    if (name) onAddChecklist(name);
    setNewChecklistName("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      {checklists.map((c) => (
        <ChecklistBlock
          key={c.id}
          checklist={c}
          onAddItem={onAddItem}
          onToggleItem={onToggleItem}
        />
      ))}

      {adding ? (
        <input
          autoFocus
          value={newChecklistName}
          onChange={(e) => setNewChecklistName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitNew();
            if (e.key === "Escape") setAdding(false);
          }}
          onBlur={submitNew}
          placeholder="اسم قائمة التحقق..."
          className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة قائمة تحقق
        </button>
      )}
    </div>
  );
}
