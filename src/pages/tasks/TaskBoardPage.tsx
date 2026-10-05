import { useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { Loader2, FileStack, Copy, ChevronRight } from "lucide-react";
import { useTaskBoard } from "../../hooks/tasks/useTaskBoard";
import TaskTable from "../../components/tasks/board/TaskTable";
import TemplatePickerModal from "../../components/tasks/templates/TemplatePickerModal";
import ZoneCloneModal from "../../components/tasks/clone/ZoneCloneModal";
import { TemplateModeProvider } from "../../components/tasks/TemplateModeContext";
import TemplateSyncBanner from "../../components/tasks/templates/TemplateSyncBanner";
import PushToBoardsModal from "../../components/tasks/templates/PushToBoardsModal";
import { useTemplateSyncActions, useTemplateSyncStatus } from "../../hooks/tasks/useTemplateSync";

// D2 — Zone board (list view), the main screen (build plan Part 7).
// Also the template editor: a template is a board with is_template set
// (opened from /tasks/admin/templates), rendered here in template mode —
// see TemplateModeContext.tsx for what that changes.
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
  // Template push (useTemplateSync.ts): the task ids the dialog opens with.
  const [pushTaskIds, setPushTaskIds] = useState<string[] | null>(null);
  const { status: syncStatus } = useTemplateSyncStatus(boardId);
  const { dismiss } = useTemplateSyncActions();

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

  const isTemplate = data.board.is_template;
  // Pushing only makes sense on a template, or on a board built from one.
  const canPush = !!syncStatus && (isTemplate || syncStatus.templateBoards.length > 0);
  const pendingTaskIds = canPush ? syncStatus.pendingTaskIds : [];

  return (
    <TemplateModeProvider value={isTemplate}>
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          {isTemplate && (
            <Link to="/tasks/admin/templates" className="text-gray-400 hover:text-gray-600" title="القوالب">
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <h1 className="text-base font-semibold text-gray-900">{data.board.name}</h1>
          {isTemplate && (
            <span className="flex items-center gap-1 rounded-full bg-primary-superLight px-2 py-0.5 text-xs font-medium text-primary">
              <FileStack className="h-3 w-3" />
              قالب
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isTemplate && (
            <button
              onClick={() => setShowZoneClone(true)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Copy className="h-3.5 w-3.5" />
              استنساخ منطقة
            </button>
          )}
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileStack className="h-3.5 w-3.5" />
            استخدام قالب
          </button>
        </div>
      </div>

      {pendingTaskIds.length > 0 && (
        <TemplateSyncBanner
          isTemplate={isTemplate}
          pendingCount={pendingTaskIds.length}
          onPush={() => setPushTaskIds(pendingTaskIds)}
          onDismiss={() => dismiss({ boardId: data.board.id, taskIds: pendingTaskIds })}
        />
      )}

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
          dependencyClearedTaskIds={data.dependencyClearedTaskIds}
          unmetRequirementTaskIds={data.unmetRequirementTaskIds}
          attachedTaskIds={data.attachedTaskIds}
          commentedTaskIds={data.commentedTaskIds}
          tagsByTask={data.tagsByTask}
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
          onPushSelected={canPush ? setPushTaskIds : undefined}
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

      {pushTaskIds && syncStatus && (
        <PushToBoardsModal
          boardId={data.board.id}
          isTemplate={isTemplate}
          status={syncStatus}
          tasks={data.tasks}
          initialTaskIds={pushTaskIds}
          onClose={() => setPushTaskIds(null)}
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
    </TemplateModeProvider>
  );
}
