import { useMemo, useRef, useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import TaskRow, { ROW_GRID } from "./TaskRow";
import type {
  EmployeeLite,
  Priority,
  StatusRow,
  TaskRow as TaskRowType,
  TaskTypeLite,
} from "../../../hooks/tasks/useTaskBoard";

type GroupBy = "none" | "department" | "assignee" | "task_type" | "zone";

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "بدون تجميع",
  zone: "المنطقة",
  department: "القسم",
  assignee: "الموظف المسؤول",
  task_type: "نوع المهمة",
};

interface TaskTableProps {
  boardZoneId: string | null;
  zoneName: string | null;
  tasks: TaskRowType[];
  statuses: StatusRow[];
  employeesById: Map<string, EmployeeLite>;
  allEmployees: EmployeeLite[];
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  onChangeStatus: (taskId: string, statusId: string) => void;
  onChangePriority: (taskId: string, priority: Priority | null) => void;
  onChangeDueDate: (taskId: string, date: string | null) => void;
  onChangeAssignees: (taskId: string, userIds: string[]) => void;
  onCreateTask: (title: string, parentTaskId: string | null) => void;
  canCreateTask: boolean;
}

function computeDepths(tasks: TaskRowType[]): Map<string, number> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const depths = new Map<string, number>();
  const depthOf = (id: string, seen = new Set<string>()): number => {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0; // guards a corrupt/cyclical parent chain
    seen.add(id);
    const task = byId.get(id);
    const parentId = task?.parent_task_id ?? null;
    const depth = parentId && byId.has(parentId) ? depthOf(parentId, seen) + 1 : 0;
    depths.set(id, depth);
    return depth;
  };
  for (const t of tasks) depthOf(t.id);
  return depths;
}

export default function TaskTable({
  boardZoneId,
  zoneName,
  tasks,
  statuses,
  employeesById,
  allEmployees,
  assigneesByTask,
  taskTypes,
  departmentNamesById,
  linkedTaskIds,
  blockedTaskIds,
  unmetRequirementTaskIds,
  onChangeStatus,
  onChangePriority,
  onChangeDueDate,
  onChangeAssignees,
  onCreateTask,
  canCreateTask,
}: TaskTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const hasSeededCollapse = useRef(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, TaskRowType[]>();
    for (const t of tasks) {
      const key = t.parent_task_id;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  // Seed the collapsed set exactly once per board (the parent remounts
  // this component with key={boardId}) — collapsed by default beyond 1
  // level, per clickup-task-ui. Guarded by a ref rather than "is
  // collapsedIds empty" so that a user expanding every row back to an
  // empty set doesn't get re-collapsed by the next mutation's refetch.
  if (!hasSeededCollapse.current && tasks.length > 0) {
    hasSeededCollapse.current = true;
    const depths = computeDepths(tasks);
    const initial = new Set(
      tasks
        .filter((t) => (depths.get(t.id) ?? 0) >= 1 && childrenByParent.has(t.id))
        .map((t) => t.id),
    );
    if (initial.size > 0) setCollapsedIds(initial);
  }

  const toggleCollapse = (taskId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const topLevel = childrenByParent.get(null) ?? [];

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: null, tasks: topLevel }];

    const groupKey = (t: TaskRowType): { key: string; label: string | null } => {
      switch (groupBy) {
        case "zone": {
          if (!t.zone_id) return { key: "none", label: "بدون منطقة" };
          if (t.zone_id === boardZoneId) {
            return { key: t.zone_id, label: zoneName ?? "المنطقة الحالية" };
          }
          return { key: t.zone_id, label: "منطقة أخرى" };
        }
        case "department":
          return t.department_id
            ? { key: t.department_id, label: departmentNamesById.get(t.department_id) ?? "قسم" }
            : { key: "none", label: "بدون قسم" };
        case "assignee": {
          const ids = assigneesByTask.get(t.id) ?? [];
          if (ids.length === 0) return { key: "none", label: "غير معين" };
          const first = employeesById.get(ids[0]);
          return {
            key: ids[0],
            label: first ? `${first.first_name} ${first.last_name ?? ""}` : "موظف",
          };
        }
        case "task_type": {
          const type = taskTypes.get(t.task_type_id);
          return { key: t.task_type_id, label: type?.name_ar ?? "نوع" };
        }
        default:
          return { key: "all", label: null };
      }
    };

    const map = new Map<string, { label: string | null; tasks: TaskRowType[] }>();
    for (const t of topLevel) {
      const { key, label } = groupKey(t);
      const entry = map.get(key) ?? { label, tasks: [] };
      entry.tasks.push(t);
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, label: v.label, tasks: v.tasks }));
  }, [groupBy, topLevel, boardZoneId, zoneName, departmentNamesById, assigneesByTask, employeesById, taskTypes]);

  const submitNewTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask(title, null);
    setNewTaskTitle("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 outline-none"
        >
          {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      <div className={`${ROW_GRID} sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-500`}>
        <div>عنوان المهمة</div>
        <HeaderCell label="الحالة" />
        <HeaderCell label="الأولوية" />
        <HeaderCell label="الفريق" />
        <HeaderCell label="الاستحقاق" />
        <HeaderCell label="القسم" />
        <button
          title="إضافة عمود — محرر الأعمدة قادم قريباً"
          className="flex items-center justify-center text-gray-300 hover:text-gray-500"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key}>
            {group.label && (
              <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1.5 text-xs font-medium text-gray-500">
                {group.label}{" "}
                <span className="text-gray-400">({group.tasks.length})</span>
              </div>
            )}
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                depth={0}
                childrenByParent={childrenByParent}
                collapsedIds={collapsedIds}
                onToggleCollapse={toggleCollapse}
                statuses={statuses}
                employeesById={employeesById}
                allEmployees={allEmployees}
                assigneesByTask={assigneesByTask}
                taskTypes={taskTypes}
                departmentNamesById={departmentNamesById}
                linkedTaskIds={linkedTaskIds}
                blockedTaskIds={blockedTaskIds}
                unmetRequirementTaskIds={unmetRequirementTaskIds}
                onChangeStatus={onChangeStatus}
                onChangePriority={onChangePriority}
                onChangeDueDate={onChangeDueDate}
                onChangeAssignees={onChangeAssignees}
                onCreateTask={onCreateTask}
              />
            ))}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">
            لا توجد مهام في هذه اللوحة بعد
          </div>
        )}

        {canCreateTask ? (
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Plus className="h-3.5 w-3.5 text-gray-400" />
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewTask();
                if (e.key === "Escape") setNewTaskTitle("");
              }}
              onBlur={submitNewTask}
              placeholder="إضافة مهمة..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        ) : (
          <div className="px-3 py-2 text-xs text-gray-400">
            هذه اللوحة غير مرتبطة بمشروع بعد، لا يمكن إضافة مهام إليها
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button
        title={`قريباً — تعديل/إخفاء/حذف حقل "${label}"`}
        className="text-gray-300 hover:text-gray-500"
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
    </div>
  );
}
