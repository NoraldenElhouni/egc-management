import type { CSSProperties } from "react";
import { Link2, Lock, CheckCircle2, Camera, Paperclip, MessageSquare, AlignLeft } from "lucide-react";
import StatusCell from "./StatusCell";
import PriorityCell from "./PriorityCell";
import DateCell from "./DateCell";
import StartDateCell from "./StartDateCell";
import CompletedAtCell from "./CompletedAtCell";
import TaskSourceCell from "./TaskSourceCell";
import AssigneeCell from "./AssigneeCell";
import TaskTypeCell from "./TaskTypeCell";
import Tooltip from "../../ui/Tooltip";
import type { StatusRow, TaskRow as TaskRowType, TaskTypeLite, TagLite } from "../../../hooks/tasks/useTaskBoard";
import type { AssignablePerson } from "../../../hooks/tasks/useAssignablePeople";

// A leaner sibling of board/TaskRow.tsx for the cross-board directory
// views (AssigneeViewPage, TaskTypeViewPage) — same inline-edit cells
// (StatusCell/PriorityCell/AssigneeCell/StartDateCell/DateCell/
// TaskTypeCell, all already self-contained/portal-based), but flat: no
// per-board custom columns, no drag-to-reorder, no depth/tree nesting —
// grouping by assignee or task type cuts across the parent/child tree,
// so a subtask renders as its own row with a small parent-link instead
// of nested under its parent.

// Every optional column is opt-in because four pages share this grid —
// AssigneeViewPage, TaskTypeViewPage, ProjectViewPage and SpaceTasksPage
// — and each renders its own hardcoded header-label row. Adding a track
// unconditionally would silently knock the others' headers out of
// alignment with their rows.
//
// Built as a track list rather than by concatenating strings because the
// source column sits in the MIDDLE (right after the title), so position
// matters and a `${fixed} 104px` suffix can't express it. The order here
// must match the order the cells are rendered in below, and the order of
// the <div> labels in each page's header row.
export interface DirectoryColumnOptions {
  showPriority?: boolean;
  /** Space › board, for the cross-board views where a row's origin isn't
   * implied by its grouping. */
  showSource?: boolean;
  /** Read-only completion time. */
  showCompleted?: boolean;
}

export function directoryRowGridStyle({
  showPriority = true,
  showSource = false,
  showCompleted = false,
}: DirectoryColumnOptions = {}): CSSProperties {
  const tracks = ["minmax(0,1fr)"]; // title
  if (showSource) tracks.push("150px");
  tracks.push("120px"); // status
  if (showPriority) tracks.push("84px");
  tracks.push("96px", "92px", "92px"); // team, start date, due date
  if (showCompleted) tracks.push("104px");

  return {
    display: "grid",
    gridTemplateColumns: tracks.join(" "),
    alignItems: "center",
    gap: "0.5rem",
  };
}

interface DirectoryTaskRowProps {
  task: TaskRowType;
  statuses: StatusRow[];
  employeesById: Map<string, AssignablePerson>;
  allEmployees: AssignablePerson[];
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  tagsByTask: Map<string, TagLite[]>;
  parentTitle?: string;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  dependencyClearedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  attachedTaskIds: Set<string>;
  commentedTaskIds: Set<string>;
  showPriority?: boolean;
  /** Adds a read-only "space › board" column. Needs boardNamesById and
   * spaceNameByBoardId to be passed too. */
  showSource?: boolean;
  /** Adds a read-only completion-time column. */
  showCompleted?: boolean;
  /** Both only read when showSource is set. */
  boardNamesById?: Map<string, string>;
  spaceNameByBoardId?: Map<string, string>;
  onOpenTask: (taskId: string) => void;
  onChangeStatus: (taskId: string, statusId: string) => void;
  onChangeTaskType: (taskId: string, taskTypeId: string) => void;
  onChangePriority: (taskId: string, priority: TaskRowType["priority"]) => void;
  onChangeStartDate: (taskId: string, date: string | null) => void;
  onChangeDueDate: (taskId: string, date: string | null) => void;
  onChangeAssignees: (taskId: string, userIds: string[]) => void;
}

export default function DirectoryTaskRow({
  task,
  statuses,
  employeesById,
  allEmployees,
  assigneesByTask,
  taskTypes,
  tagsByTask,
  parentTitle,
  linkedTaskIds,
  blockedTaskIds,
  dependencyClearedTaskIds,
  unmetRequirementTaskIds,
  attachedTaskIds,
  commentedTaskIds,
  showPriority = true,
  showSource = false,
  showCompleted = false,
  boardNamesById,
  spaceNameByBoardId,
  onOpenTask,
  onChangeStatus,
  onChangeTaskType,
  onChangePriority,
  onChangeStartDate,
  onChangeDueDate,
  onChangeAssignees,
}: DirectoryTaskRowProps) {
  // description is JSON, { text: string } — same read as board/TaskRow.tsx.
  const hasDescription = !!(task.description as { text?: string } | null)?.text?.trim();
  const tags = tagsByTask.get(task.id) ?? [];

  return (
    <div
      style={directoryRowGridStyle({ showPriority, showSource, showCompleted })}
      className="min-h-[34px] border-b border-gray-100 px-2 hover:bg-gray-50"
    >
      <div className="flex min-w-0 items-center gap-1">
        <TaskTypeCell
          taskTypes={taskTypes}
          currentTaskTypeId={task.task_type_id}
          onChange={(taskTypeId) => onChangeTaskType(task.id, taskTypeId)}
        />

        {/* Separate overflow-hidden wrapper from TaskTypeCell above — see
            board/TaskRow.tsx's identical note: an overflow-hidden ancestor
            clips its popover otherwise. */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {parentTitle && task.parent_task_id && (
            <button
              onClick={() => onOpenTask(task.parent_task_id as string)}
              className="shrink-0 truncate text-xs text-gray-400 hover:underline"
              title={parentTitle}
            >
              ↳ {parentTitle}
            </button>
          )}
          <button onClick={() => onOpenTask(task.id)} className="truncate text-sm text-gray-800 hover:underline">
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

          {linkedTaskIds.has(task.id) && (
            <Tooltip label="مرتبطة بسجل">
              <Link2 className="h-3 w-3 shrink-0 text-blue-400" aria-label="مرتبطة بسجل" />
            </Tooltip>
          )}
          {blockedTaskIds.has(task.id) && (
            <Tooltip label="محظورة — بانتظار مهمة أخرى">
              <Lock className="h-3 w-3 shrink-0 text-orange-500" aria-label="محظورة — بانتظار مهمة أخرى" />
            </Tooltip>
          )}
          {!blockedTaskIds.has(task.id) && dependencyClearedTaskIds.has(task.id) && (
            <Tooltip label="تم تحرير الاعتمادية — جاهزة للبدء">
              <CheckCircle2
                className="h-3 w-3 shrink-0 text-emerald-500"
                aria-label="تم تحرير الاعتمادية — جاهزة للبدء"
              />
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
        </div>
      </div>

      {showSource && (
        <TaskSourceCell
          spaceName={spaceNameByBoardId?.get(task.board_id)}
          boardName={boardNamesById?.get(task.board_id)}
        />
      )}

      <StatusCell
        statuses={statuses}
        currentStatusId={task.status_id}
        onChange={(statusId) => onChangeStatus(task.id, statusId)}
      />
      {showPriority && (
        <PriorityCell priority={task.priority} onChange={(priority) => onChangePriority(task.id, priority)} />
      )}
      <AssigneeCell
        assigneeIds={assigneesByTask.get(task.id) ?? []}
        employeesById={employeesById}
        allEmployees={allEmployees}
        onChange={(userIds) => onChangeAssignees(task.id, userIds)}
      />
      <StartDateCell startDate={task.start_date} onChange={(date) => onChangeStartDate(task.id, date)} />
      <DateCell dueDate={task.due_date} isOverdue={task.is_overdue} onChange={(date) => onChangeDueDate(task.id, date)} />
      {showCompleted && <CompletedAtCell completedAt={task.completed_at} />}
    </div>
  );
}
