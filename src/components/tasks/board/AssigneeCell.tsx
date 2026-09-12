import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type { EmployeeLite } from "../../../hooks/tasks/useTaskBoard";

// Stacked circular avatars, overflow collapses to "+N" — clickup-task-ui
// skill's "Assignee cell" rule. No shared avatar component exists in this
// app yet (each screen writes its own initials() helper); this one does
// the same, scoped to this file.
function initials(employee: EmployeeLite): string {
  const a = employee.first_name?.[0] ?? "";
  const b = employee.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AssigneeCellProps {
  assigneeIds: string[];
  employeesById: Map<string, EmployeeLite>;
  allEmployees: EmployeeLite[];
  onChange: (userIds: string[]) => void;
}

export default function AssigneeCell({
  assigneeIds,
  employeesById,
  allEmployees,
  onChange,
}: AssigneeCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const visible = assigneeIds.slice(0, 3);
  const overflow = assigneeIds.length - visible.length;

  const filtered = allEmployees.filter((e) => {
    if (!search.trim()) return true;
    const full = `${e.first_name} ${e.last_name ?? ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const toggle = (userId: string) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center -space-x-2 rtl:space-x-reverse"
        title="تعيين"
      >
        {visible.map((id) => {
          const employee = employeesById.get(id);
          return (
            <span
              key={id}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
              style={{ background: colorFor(id) }}
              title={
                employee
                  ? `${employee.first_name} ${employee.last_name ?? ""}`
                  : ""
              }
            >
              {employee ? initials(employee) : "?"}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-semibold text-gray-600">
            +{overflow}
          </span>
        )}
        {assigneeIds.length === 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300 hover:border-gray-400 hover:text-gray-400">
            <Plus className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن موظف..."
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">لا نتائج</div>
            )}
            {filtered.map((employee) => (
              <label
                key={employee.id}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(employee.id)}
                  onChange={() => toggle(employee.id)}
                  className="h-3.5 w-3.5"
                />
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                  style={{ background: colorFor(employee.id) }}
                >
                  {initials(employee)}
                </span>
                <span className="truncate">
                  {employee.first_name} {employee.last_name ?? ""}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
