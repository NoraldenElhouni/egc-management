import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTaskBoard } from "../../../hooks/tasks/useTaskBoard";
import TaskTable from "../board/TaskTable";

// One board rendered as a real, fully-editable D2 board table (same
// TaskTable + useTaskBoard combo TaskBoardPage.tsx itself uses), wrapped
// in a collapsible card. Used when the cross-board "all tasks"/"space
// tasks" list is grouped by Board — that's the one grouping where every
// task in the group genuinely shares the same schema (a board's own
// custom columns), so a real editable table is coherent; every other
// grouping (status, priority, assignee, project...) mixes tasks from
// boards with potentially different custom columns, so those stay a
// plain read-only row list (FlatTaskList's own rendering).
//
// Body (the expensive part: full board fetch + custom columns + values)
// only mounts once the card is actually opened — with several boards on
// screen at once, firing every board's full query up front just to show
// collapsed headers would be wasteful. Row clicks inside TaskTable
// navigate to the task's own board page (TaskRow's own behavior,
// unchanged) rather than opening the panel in place here — this literally
// is the board page, just reached from a different entry point.

interface BoardTaskCardProps {
  boardId: string;
  boardName: string;
  taskCount: number;
  defaultOpen?: boolean;
}

export default function BoardTaskCard({ boardId, boardName, taskCount, defaultOpen = false }: BoardTaskCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mx-6 my-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-gray-50 px-4 py-2.5 text-right hover:bg-gray-100"
      >
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="flex-1 truncate text-sm font-semibold text-gray-800">{boardName}</span>
        <span className="text-xs text-gray-400">{taskCount}</span>
      </button>
      {open && <BoardTaskCardBody boardId={boardId} />}
    </div>
  );
}

function BoardTaskCardBody({ boardId }: { boardId: string }) {
  const {
    data,
    loading,
    error,
    employeesById,
    updateStatus,
    updatePriority,
    updateDueDate,
    setAssignees,
    createTask,
    setTaskValue,
    attachField,
    createAndAttachField,
    detachColumn,
    setColumnVisibility,
    renameField,
    moveTaskTo,
  } = useTaskBoard(boardId);

  if (loading) {
    return (
      <div className="flex items-center justify-center border-t border-gray-100 p-6 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="border-t border-gray-100 p-4 text-sm text-red-500">تعذّر تحميل اللوحة</div>;
  }

  return (
    <div className="h-[26rem] border-t border-gray-100">
      <TaskTable
        key={boardId}
        boardId={data.board.id}
        boardZoneId={data.board.zone_id}
        zoneName={data.zoneName}
        tasks={data.tasks}
        statuses={data.statuses}
        employeesById={employeesById}
        allEmployees={data.employees}
        assigneesByTask={data.assigneesByTask}
        taskTypes={data.taskTypes}
        departmentNamesById={data.departmentNamesById}
        linkedTaskIds={data.linkedTaskIds}
        blockedTaskIds={data.blockedTaskIds}
        unmetRequirementTaskIds={data.unmetRequirementTaskIds}
        subtaskProgressByTask={data.subtaskProgressByTask}
        customColumns={data.customColumns}
        hiddenColumns={data.hiddenColumns}
        valuesByTask={data.valuesByTask}
        featureSettings={data.featureSettings}
        onChangeStatus={(taskId, statusId) => updateStatus({ taskId, statusId })}
        onChangePriority={(taskId, priority) => updatePriority({ taskId, priority })}
        onChangeDueDate={(taskId, dueDate) => updateDueDate({ taskId, dueDate })}
        onChangeAssignees={(taskId, userIds) => setAssignees({ taskId, userIds })}
        onCreateTask={(title, parentTaskId) => createTask({ title, parentTaskId })}
        onChangeValue={(taskId, fieldDefinitionId, value) => setTaskValue({ taskId, fieldDefinitionId, value })}
        onAttachField={attachField}
        onCreateAndAttachField={createAndAttachField}
        onDetachColumn={detachColumn}
        onSetColumnVisibility={(boardColumnId, visible) => setColumnVisibility({ boardColumnId, visible })}
        onRenameField={(fieldDefinitionId, name_ar) => renameField({ fieldDefinitionId, name_ar })}
        onMoveTaskTo={moveTaskTo}
      />
    </div>
  );
}
