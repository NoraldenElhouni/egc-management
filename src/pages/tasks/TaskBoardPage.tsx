import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Loader2, FileStack, Copy } from "lucide-react";
import { useTaskBoard } from "../../hooks/tasks/useTaskBoard";
import TaskTable from "../../components/tasks/board/TaskTable";
import TemplatePickerModal from "../../components/tasks/templates/TemplatePickerModal";
import ZoneCloneModal from "../../components/tasks/clone/ZoneCloneModal";

// D2 — Zone board (list view), the main screen (build plan Part 7).
export default function TaskBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const {
    data,
    loading,
    error,
    employeesById,
    updateStatus,
    updateTaskType,
    updatePriority,
    updateStartDate,
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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showZoneClone, setShowZoneClone] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        تعذّر تحميل اللوحة
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h1 className="text-base font-semibold text-gray-900">{data.board.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowZoneClone(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Copy className="h-3.5 w-3.5" />
            استنساخ منطقة
          </button>
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileStack className="h-3.5 w-3.5" />
            استخدام قالب
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
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
          attachedTaskIds={data.attachedTaskIds}
          commentedTaskIds={data.commentedTaskIds}
          subtaskProgressByTask={data.subtaskProgressByTask}
          customColumns={data.customColumns}
          hiddenColumns={data.hiddenColumns}
          valuesByTask={data.valuesByTask}
          featureSettings={data.featureSettings}
          onChangeStatus={(taskId, statusId) => updateStatus({ taskId, statusId })}
          onChangeTaskType={(taskId, taskTypeId) => updateTaskType({ taskId, taskTypeId })}
          onChangePriority={(taskId, priority) => updatePriority({ taskId, priority })}
          onChangeStartDate={(taskId, startDate) => updateStartDate({ taskId, startDate })}
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

      {/* D3 slide-over, nested route board/:boardId/task/:taskId — see
          TasksRoutes.tsx. TaskDetailPanel itself is a fixed overlay, so
          this Outlet mounting here (rather than replacing the list) is
          what keeps the board visible behind it. */}
      <Outlet />

      {showTemplatePicker && (
        <TemplatePickerModal
          spaceId={data.board.space_id}
          currentBoardId={data.board.id}
          onClose={() => setShowTemplatePicker(false)}
          onApplied={() => setShowTemplatePicker(false)}
        />
      )}

      {showZoneClone && (
        <ZoneCloneModal
          spaceId={data.board.space_id}
          currentBoardId={data.board.id}
          onClose={() => setShowZoneClone(false)}
          onApplied={() => setShowZoneClone(false)}
        />
      )}
    </div>
  );
}
