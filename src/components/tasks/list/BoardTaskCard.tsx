import { useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, Layers, Loader2 } from "lucide-react";
import { useTaskBoard } from "../../../hooks/tasks/useTaskBoard";
import TaskTable from "../board/TaskTable";

// One board rendered as a real, fully-editable D2 board table (same
// TaskTable + useTaskBoard combo TaskBoardPage.tsx itself uses), wrapped
// in a collapsible card. This is always the leaf of FlatTaskList's tree,
// however many Project/Space/Folder/Status/Assignee/... layers wrap it —
// Board is the one level where "what columns, what order" is
// unambiguous (one board, one schema), so it's the only level that gets
// custom columns, drag-reorder, and add-task; nothing above it tries to
// merge tasks from different boards into one editable table.
//
// Open state is controlled by the parent (FlatTaskList's own
// usePersistedOpenSet, keyed by the same "board:<uuid>" node id every
// other level uses) rather than local state, so board cards default
// open exactly like every other level, persist the same way, and are
// included in "expand all / collapse all". The body (the expensive
// part: full board fetch + custom columns + values) only mounts while
// open — with several boards open at once by default, that's still one
// query per visible board, same cost a real multi-board page would have.
// Row clicks inside TaskTable navigate to the task's own board page
// (TaskRow's own behavior, unchanged) rather than opening the panel in
// place here — this literally is the board page, just reached from a
// different entry point.

interface BoardTaskCardProps {
  boardId: string;
  boardName: string;
  taskCount: number;
  open: boolean;
  onToggle: () => void;
}

export default function BoardTaskCard({ boardId, boardName, taskCount, open, onToggle }: BoardTaskCardProps) {
  const navigate = useNavigate();

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div className={`flex w-full items-center gap-2 bg-white px-4 py-2.5 ${open ? "border-b border-gray-100" : ""}`}>
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 overflow-hidden text-right">
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1 truncate text-sm font-semibold text-gray-800">{boardName}</span>
          <span className="text-xs text-gray-400">{taskCount}</span>
        </button>
        <button
          onClick={() => navigate(`/tasks/board/${boardId}`)}
          className="shrink-0 rounded p-1 text-gray-300 hover:bg-gray-200 hover:text-gray-600"
          title="فتح اللوحة في صفحتها"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
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
