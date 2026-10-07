import { useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import { useAnchoredPosition } from "../../../hooks/tasks/useAnchoredPosition";
import { useProjectMemberIds } from "../../../hooks/tasks/useProjectMemberIds";
import type { AssignablePerson } from "../../../hooks/tasks/useAssignablePeople";
import Tooltip from "../../ui/Tooltip";
import { colorFor, initials } from "./employeeAvatar";

// Stacked circular avatars, overflow collapses to "+N" — clickup-task-ui
// skill's "Assignee cell" rule. Lists both employees and linked
// contractors (public.assignable_people) — contractors get a small badge
// so they read as distinct from internal staff.
//
// The picker lists people in three groups: already on this task, then the
// project's team (public.team_assignments), then everyone else A-Z.
//
// variant="button" swaps the avatar stack for a plain trigger, for places
// that render the assignees themselves (the detail panel's removable rows,
// the board's bulk-action bar).

interface AssigneeCellProps {
  assigneeIds: string[];
  employeesById: Map<string, AssignablePerson>;
  allEmployees: AssignablePerson[];
  onChange: (userIds: string[]) => void;
  /** The task's project — drives the "project team" group. */
  projectId?: string | null;
  /** See StatusCell's align prop — "left" for narrow contexts near the
   * screen's left edge (the D3 detail panel). */
  align?: "left" | "right";
  /** Display only: the popover never opens (no edit rights). */
  readOnly?: boolean;
  variant?: "stack" | "button";
  /** Trigger content for variant="button". */
  buttonContent?: ReactNode;
  buttonClassName?: string;
}

const fullName = (e: AssignablePerson) => `${e.first_name} ${e.last_name ?? ""}`.trim();

export default function AssigneeCell({
  assigneeIds,
  employeesById,
  allEmployees,
  onChange,
  projectId,
  align = "right", readOnly = false,
  variant = "stack",
  buttonContent,
  buttonClassName,
}: AssigneeCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  // Portaled to document.body and placed by useAnchoredPosition, so it
  // opens upward on the last rows instead of being clipped by the list.
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside([ref, popoverRef], () => setOpen(false));
  const pos = useAnchoredPosition(ref, popoverRef, { open, width: 224, align });
  const { data: memberIds } = useProjectMemberIds(projectId, open);

  const visible = assigneeIds.slice(0, 3);
  const overflow = assigneeIds.length - visible.length;

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = (e: AssignablePerson) => !term || fullName(e).toLowerCase().includes(term);

    const assignedSet = new Set(assigneeIds);
    const byId = new Map(allEmployees.map((e) => [e.id, e]));
    const assigned = assigneeIds
      .map((id) => byId.get(id))
      .filter((e): e is AssignablePerson => !!e && matches(e));

    const rest = allEmployees
      .filter((e) => !assignedSet.has(e.id) && matches(e))
      // employees first, then contractors, each A-Z
      .sort(
        (a, b) =>
          Number(a.person_type === "contractor") - Number(b.person_type === "contractor") ||
          fullName(a).localeCompare(fullName(b), "ar"),
      );
    const team = rest.filter((e) => memberIds?.has(e.id));
    const others = rest.filter((e) => !memberIds?.has(e.id));

    return [
      { key: "assigned", label: "المكلّفون", people: assigned },
      { key: "team", label: "فريق المشروع", people: team },
      { key: "others", label: "الآخرون", people: others },
    ].filter((g) => g.people.length > 0);
  }, [allEmployees, assigneeIds, memberIds, search]);

  const toggle = (userId: string) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      {variant === "button" ? (
        <button onClick={() => !readOnly && setOpen((v) => !v)} className={buttonClassName}>
          {buttonContent ?? <Plus className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <button
          onClick={() => !readOnly && setOpen((v) => !v)}
          className="flex items-center -space-x-2 rtl:space-x-reverse"
          title={assigneeIds.length === 0 ? "تعيين" : undefined}
        >
          {visible.map((id) => {
            const employee = employeesById.get(id);
            const label = employee
              ? `${employee.first_name} ${employee.last_name ?? ""}${employee.person_type === "contractor" ? " (مقاول)" : ""}`
              : null;
            return (
              <Tooltip key={id} label={label}>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                  style={{ background: colorFor(id) }}
                >
                  {employee ? initials(employee) : "?"}
                </span>
              </Tooltip>
            );
          })}
          {overflow > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-semibold text-gray-600">
              +{overflow}
            </span>
          )}
          {assigneeIds.length === 0 && !readOnly && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300 hover:border-gray-400 hover:text-gray-400">
              <Plus className="h-3 w-3" />
            </span>
          )}
        </button>
      )}

      {open && createPortal(
        <div
          ref={popoverRef}
          dir="rtl"
          style={{
            position: "fixed",
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            width: 224,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-50 rounded-lg border border-gray-200 bg-white shadow-lg"
        >
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
            {groups.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">لا نتائج</div>
            )}
            {groups.map((group) => (
              <div key={group.key}>
                {groups.length > 1 && (
                  <div className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold text-gray-400">
                    {group.label}
                  </div>
                )}
                {group.people.map((employee) => (
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
                    {employee.person_type === "contractor" && (
                      <span className="ms-auto shrink-0 rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700">
                        مقاول
                      </span>
                    )}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
