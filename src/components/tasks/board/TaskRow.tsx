import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, GripVertical, Plus, Link2, Lock, Camera, Paperclip, MessageSquare, AlignLeft } from "lucide-react";
import StatusCell from "./StatusCell";
import PriorityCell from "./PriorityCell";
import DateCell from "./DateCell";
import StartDateCell from "./StartDateCell";
import AssigneeCell from "./AssigneeCell";
import CustomFieldCell from "./CustomFieldCell";
import TaskTypeCell from "./TaskTypeCell";
import Tooltip from "../../ui/Tooltip";
import type {
  CustomColumn,
  StatusRow,
  TaskRow as TaskRowType,
  TaskTypeLite,
  TagLite,
} from "../../../hooks/tasks/useTaskBoard";
import type { AssignablePerson } from "../../../hooks/tasks/useAssignablePeople";
import type { Json } from "../../../lib/supabase";

const FIXED_COLUMNS_WITH_PRIORITY = "minmax(0,1fr) 120px 84px 96px 92px 92px 100px";
const FIXED_COLUMNS_NO_PRIORITY = "minmax(0,1fr) 120px 96px 92px 92px 100px";

// A dynamic grid template (custom columns vary per board) can't be a
// static Tailwind class, so both the header (TaskTable) and every row
// compute the same inline style from the same column count — they must
// stay in sync or cells drift out from under their header. showPriority
// comes from the space's feature toggles (D9) — turning "priorities" off
// used to save the setting without anything reading it back.
export function rowGridStyle(customColumnCount: number, showPriority = true): CSSProperties {
  const fixed = showPriority ? FIXED_COLUMNS_WITH_PRIORITY : FIXED_COLUMNS_NO_PRIORITY;
  const customCols = Array(customColumnCount).fill("120px").join(" ");
  return {
    display: "grid",
    gridTemplateColumns: `${fixed}${customCols ? ` ${customCols}` : ""} 64px`,
    alignItems: "center",
    gap: "0.5rem",
  };
}

type DropZone = "before" | "after" | "inside";

interface TaskRowProps {
  task: TaskRowType;
  boardId: string;
  depth: number;
  childrenByParent: Map<string | null, TaskRowType[]>;
  collapsedIds: Set<string>;
  onToggleCollapse: (taskId: string) => void;
  statuses: StatusRow[];
  employeesById: Map<string, AssignablePerson>;
  allEmployees: AssignablePerson[];
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  attachedTaskIds: Set<string>;
  commentedTaskIds: Set<string>;
  tagsByTask: Map<string, TagLite[]>;
  subtaskProgressByTask: Map<string, { done: number; total: number }>;
  customColumns: CustomColumn[];
  valuesByTask: Map<string, Map<string, Json>>;
  showPriority: boolean;
  showTaskType: boolean;
  onChangeStatus: (taskId: string, statusId: string) => void;
  onChangeTaskType: (taskId: string, taskTypeId: string) => void;
  onChangePriority: (taskId: string, priority: TaskRowType["priority"]) => void;
  onChangeStartDate: (taskId: string, date: string | null) => void;
  onChangeDueDate: (taskId: string, date: string | null) => void;
  onChangeAssignees: (taskId: string, userIds: string[]) => void;
  onCreateTask: (title: string, parentTaskId: string) => void;
  onChangeValue: (taskId: string, fieldDefinitionId: string, value: Json) => void;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onMoveTaskTo: (input: { id: string; newParentId: string | null; beforeId: string | null }) => void;
}

export default function TaskRow({
  task,
  boardId,
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
  attachedTaskIds,
  commentedTaskIds,
  tagsByTask,
  subtaskProgressByTask,
  customColumns,
  valuesByTask,
  showPriority,
  showTaskType,
  onChangeStatus,
  onChangeTaskType,
  onChangePriority,
  onChangeStartDate,
  onChangeDueDate,
  onChangeAssignees,
  onCreateTask,
  onChangeValue,
  draggedId,
  onDragStart,
  onDragEnd,
  onMoveTaskTo,
}: TaskRowProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const children = childrenByParent.get(task.id) ?? [];
  const hasChildren = children.length > 0;
  const collapsed = collapsedIds.has(task.id) && !addingChild;
  const siblings = childrenByParent.get(task.parent_task_id) ?? [];

  const handleDrop = () => {
    if (!draggedId || draggedId === task.id) return setDropZone(null);
    if (dropZone === "inside") {
      onMoveTaskTo({ id: draggedId, newParentId: task.id, beforeId: null });
    } else if (dropZone === "before") {
      onMoveTaskTo({ id: draggedId, newParentId: task.parent_task_id, beforeId: task.id });
    } else if (dropZone === "after") {
      const index = siblings.findIndex((s) => s.id === task.id);
      const nextSibling = siblings[index + 1];
      onMoveTaskTo({
        id: draggedId,
        newParentId: task.parent_task_id,
        beforeId: nextSibling && nextSibling.id !== draggedId ? nextSibling.id : null,
      });
    }
    setDropZone(null);
  };

  const submitChild = () => {
    const title = childTitle.trim();
    if (title) onCreateTask(title, task.id);
    setChildTitle("");
    setAddingChild(false);
  };
  const department = task.department_id
    ? departmentNamesById.get(task.department_id)
    : null;
  const progress = subtaskProgressByTask.get(task.id);
  // description is JSON, { text: string } (build plan §4.7) — see
  // TaskDetailPanel.tsx's own read of the same field.
  const hasDescription = !!(task.description as { text?: string } | null)?.text?.trim();
  const tags = tagsByTask.get(task.id) ?? [];

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={(e) => {
          if (!draggedId || draggedId === task.id) return;
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientY - rect.top) / rect.height;
          setDropZone(ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside");
        }}
        onDragLeave={() => setDropZone(null)}
        onDrop={handleDrop}
        style={rowGridStyle(customColumns.length, showPriority)}
        className={`min-h-[34px] border-b border-gray-100 px-2 hover:bg-gray-50 ${
          dropZone === "before"
            ? "border-t-2 border-t-primary"
            : dropZone === "after"
              ? "border-b-2 border-b-primary"
              : dropZone === "inside"
                ? "bg-primary-superLight"
                : ""
        }`}
      >
        <div
          className="flex min-w-0 items-center gap-1"
          style={{ paddingRight: depth * 20 }}
        >
          <span className="w-4 shrink-0 text-gray-300">
            {hovered && (
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  onDragStart(task.id);
                }}
                onDragEnd={onDragEnd}
                className="cursor-grab"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </span>
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

          {showTaskType && (
            <TaskTypeCell
              taskTypes={taskTypes}
              currentTaskTypeId={task.task_type_id}
              onChange={(taskTypeId) => onChangeTaskType(task.id, taskTypeId)}
            />
          )}

          {/* Separate overflow-hidden wrapper from TaskTypeCell above: its
              popover is position:absolute off a `relative` ancestor inside
              here, and an overflow-hidden ancestor clips absolutely
              positioned descendants too, not just overflowing text. */}
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            <button
              onClick={() => navigate(`/tasks/board/${boardId}/task/${task.id}`)}
              className="truncate text-sm text-gray-800 hover:underline"
            >
              {task.title}
            </button>

            {tags.length > 0 && (
              <span
                className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${tags[0].color ?? "#6B7280"}1A`, color: tags[0].color ?? "#6B7280" }}
              >
                {tags[0].name}
              </span>
            )}
            {tags.length > 1 && (
              <Tooltip label={tags.slice(1).map((t) => t.name).join("، ")}>
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  +{tags.length - 1}
                </span>
              </Tooltip>
            )}

            {progress && (
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  progress.done === progress.total
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-500"
                }`}
                title="المهام الفرعية المكتملة"
              >
                {progress.done}/{progress.total}
              </span>
            )}

            {linkedTaskIds.has(task.id) && (
              <Tooltip label="مرتبطة بسجل">
                <Link2 className="h-3 w-3 shrink-0 text-blue-400" aria-label="مرتبطة بسجل" />
              </Tooltip>
            )}
            {blockedTaskIds.has(task.id) && (
              <Tooltip label="محظورة">
                <Lock className="h-3 w-3 shrink-0 text-gray-400" aria-label="محظورة" />
              </Tooltip>
            )}
            {unmetRequirementTaskIds.has(task.id) && (
              <Tooltip label="متطلبات غير مكتملة">
                <Camera className="h-3 w-3 shrink-0 text-amber-500" aria-label="متطلبات غير مكتملة" />
              </Tooltip>
            )}
            {hasDescription && (
              <Tooltip label="تحتوي على وصف">
                <AlignLeft className="h-3 w-3 shrink-0 text-blue-500" aria-label="تحتوي على وصف" />
              </Tooltip>
            )}
            {attachedTaskIds.has(task.id) && (
              <Tooltip label="تحتوي على مرفقات">
                <Paperclip className="h-3 w-3 shrink-0 text-blue-500" aria-label="تحتوي على مرفقات" />
              </Tooltip>
            )}
            {commentedTaskIds.has(task.id) && (
              <Tooltip label="تحتوي على تعليقات">
                <MessageSquare className="h-3 w-3 shrink-0 text-blue-500" aria-label="تحتوي على تعليقات" />
              </Tooltip>
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
        </div>

        <StatusCell
          statuses={statuses}
          currentStatusId={task.status_id}
          onChange={(statusId) => onChangeStatus(task.id, statusId)}
        />
        {showPriority && (
          <PriorityCell
            priority={task.priority}
            onChange={(priority) => onChangePriority(task.id, priority)}
          />
        )}
        <AssigneeCell
          assigneeIds={assigneesByTask.get(task.id) ?? []}
          employeesById={employeesById}
          allEmployees={allEmployees}
          onChange={(userIds) => onChangeAssignees(task.id, userIds)}
        />
        <StartDateCell
          startDate={task.start_date}
          onChange={(date) => onChangeStartDate(task.id, date)}
        />
        <DateCell
          dueDate={task.due_date}
          isOverdue={task.is_overdue}
          onChange={(date) => onChangeDueDate(task.id, date)}
        />
        <div className="truncate text-xs text-gray-400">{department ?? ""}</div>
        {customColumns.map((col) => (
          <CustomFieldCell
            key={col.boardColumnId}
            column={col}
            value={valuesByTask.get(task.id)?.get(col.fieldDefinitionId)}
            employeesById={employeesById}
            allEmployees={allEmployees}
            onChange={(value) => onChangeValue(task.id, col.fieldDefinitionId, value)}
          />
        ))}
        <div />
      </div>

      {!collapsed && (
        <>
          {children.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              boardId={boardId}
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
              attachedTaskIds={attachedTaskIds}
              commentedTaskIds={commentedTaskIds}
              tagsByTask={tagsByTask}
              subtaskProgressByTask={subtaskProgressByTask}
              customColumns={customColumns}
              valuesByTask={valuesByTask}
              showPriority={showPriority}
              showTaskType={showTaskType}
              onChangeStatus={onChangeStatus}
              onChangeTaskType={onChangeTaskType}
              onChangePriority={onChangePriority}
              onChangeStartDate={onChangeStartDate}
              onChangeDueDate={onChangeDueDate}
              onChangeAssignees={onChangeAssignees}
              onCreateTask={onCreateTask}
              onChangeValue={onChangeValue}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMoveTaskTo={onMoveTaskTo}
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
