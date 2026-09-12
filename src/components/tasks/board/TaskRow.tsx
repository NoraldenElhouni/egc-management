import { useState } from "react";
import { ChevronDown, ChevronLeft, GripVertical, Plus, Link2, Lock, Camera } from "lucide-react";
import StatusCell from "./StatusCell";
import PriorityCell from "./PriorityCell";
import DateCell from "./DateCell";
import AssigneeCell from "./AssigneeCell";
import type {
  EmployeeLite,
  StatusRow,
  TaskRow as TaskRowType,
  TaskTypeLite,
} from "../../../hooks/tasks/useTaskBoard";

export const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_120px_84px_96px_92px_100px_64px] items-center gap-2";

interface TaskRowProps {
  task: TaskRowType;
  depth: number;
  childrenByParent: Map<string | null, TaskRowType[]>;
  collapsedIds: Set<string>;
  onToggleCollapse: (taskId: string) => void;
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
  onChangePriority: (taskId: string, priority: TaskRowType["priority"]) => void;
  onChangeDueDate: (taskId: string, date: string | null) => void;
  onChangeAssignees: (taskId: string, userIds: string[]) => void;
  onCreateTask: (title: string, parentTaskId: string) => void;
}

export default function TaskRow({
  task,
  depth,
  childrenByParent,
  collapsedIds,
  onToggleCollapse,
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
}: TaskRowProps) {
  const [hovered, setHovered] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const children = childrenByParent.get(task.id) ?? [];
  const hasChildren = children.length > 0;
  const collapsed = collapsedIds.has(task.id) && !addingChild;

  const submitChild = () => {
    const title = childTitle.trim();
    if (title) onCreateTask(title, task.id);
    setChildTitle("");
    setAddingChild(false);
  };
  const taskType = taskTypes.get(task.task_type_id);
  const department = task.department_id
    ? departmentNamesById.get(task.department_id)
    : null;

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`${ROW_GRID} min-h-[34px] border-b border-gray-100 px-2 hover:bg-gray-50`}
      >
        <div
          className="flex items-center gap-1 overflow-hidden"
          style={{ paddingRight: depth * 20 }}
        >
          <span className="w-4 shrink-0 text-gray-300">
            {hovered && (
              <GripVertical className="h-3.5 w-3.5 cursor-grab" />
            )}
          </span>

          {hasChildren ? (
            <button
              onClick={() => onToggleCollapse(task.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              {collapsed ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {taskType && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: taskType.color ?? "#9CA3AF" }}
              title={taskType.name_ar}
            />
          )}

          <span className="truncate text-sm text-gray-800">{task.title}</span>

          {linkedTaskIds.has(task.id) && (
            <Link2 className="h-3 w-3 shrink-0 text-blue-400" aria-label="مرتبطة بسجل" />
          )}
          {blockedTaskIds.has(task.id) && (
            <Lock className="h-3 w-3 shrink-0 text-gray-400" aria-label="محظورة" />
          )}
          {unmetRequirementTaskIds.has(task.id) && (
            <Camera className="h-3 w-3 shrink-0 text-amber-500" aria-label="متطلبات غير مكتملة" />
          )}

          {hovered && !addingChild && (
            <button
              onClick={() => setAddingChild(true)}
              className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              title="إضافة مهمة فرعية"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <StatusCell
          statuses={statuses}
          currentStatusId={task.status_id}
          onChange={(statusId) => onChangeStatus(task.id, statusId)}
        />
        <PriorityCell
          priority={task.priority}
          onChange={(priority) => onChangePriority(task.id, priority)}
        />
        <AssigneeCell
          assigneeIds={assigneesByTask.get(task.id) ?? []}
          employeesById={employeesById}
          allEmployees={allEmployees}
          onChange={(userIds) => onChangeAssignees(task.id, userIds)}
        />
        <DateCell
          dueDate={task.due_date}
          isOverdue={task.is_overdue}
          onChange={(date) => onChangeDueDate(task.id, date)}
        />
        <div className="truncate text-xs text-gray-400">{department ?? ""}</div>
        <div />
      </div>

      {!collapsed && (
        <>
          {children.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              childrenByParent={childrenByParent}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
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

          {addingChild && (
            <div
              className="flex items-center gap-1.5 border-b border-gray-100 px-2 py-1.5"
              style={{ paddingRight: (depth + 1) * 20 + 16 }}
            >
              <Plus className="h-3.5 w-3.5 text-gray-400" />
              <input
                autoFocus
                value={childTitle}
                onChange={(e) => setChildTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitChild();
                  if (e.key === "Escape") {
                    setChildTitle("");
                    setAddingChild(false);
                  }
                }}
                onBlur={submitChild}
                placeholder="عنوان المهمة الفرعية..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
