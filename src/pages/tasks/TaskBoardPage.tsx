import { useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { FileStack, Copy, ChevronRight, List, ChartGantt } from "lucide-react";
import { useTaskBoard } from "../../hooks/tasks/useTaskBoard";
import TaskTable from "../../components/tasks/board/TaskTable";
import BoardSwitcher from "../../components/tasks/board/BoardSwitcher";
import TaskGantt from "../../components/tasks/gantt/TaskGantt";
import TemplatePickerModal from "../../components/tasks/templates/TemplatePickerModal";
import ZoneCloneModal from "../../components/tasks/clone/ZoneCloneModal";
import { TemplateModeProvider } from "../../components/tasks/TemplateModeContext";
import { TemplateRolesProvider } from "../../components/tasks/TemplateRolesContext";
import { useTaskRoles } from "../../hooks/tasks/useTaskRoles";
import TemplateSyncBanner from "../../components/tasks/templates/TemplateSyncBanner";
import PushToBoardsModal from "../../components/tasks/templates/PushToBoardsModal";
import { useTemplateSyncActions, useTemplateSyncStatus } from "../../hooks/tasks/useTemplateSync";
import { NO_CAPS, useMyTaskAccess, useSpaceCaps } from "../../hooks/tasks/useTaskAccess";
import { BoardAccessProvider } from "../../components/tasks/BoardAccessContext";
import { TaskListPageSkeleton } from "../../components/tasks/TasksSkeletons";

// D2 — Zone board (list view), the main screen (build plan Part 7).
// Also the template editor: a template is a board with is_template set
// (opened from /tasks/admin/templates), rendered here in template mode —
// see TemplateModeContext.tsx for what that changes.
//
// `view` comes from the route: board/:id is the list, board/:id/gantt the
// Gantt (TasksRoutes.tsx). Both read the same useTaskBoard query, so
// switching is instant and edits made in one show up in the other.
export default function TaskBoardPage({ view }: { view: "list" | "gantt" }) {
  const { boardId } = useParams<{ boardId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
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
    updateTaskDates,
    setAssignees,
    bulkSetStatus,
    bulkSetPriority,
    bulkAssign,
    bulkDelete,
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
  // Project roles on a template's tasks (useTaskRoles.ts) — loaded only for templates.
  const { rolesByTask, setTaskRoles } = useTaskRoles(
    boardId,
    data?.tasks.map((t) => t.id) ?? [],
    !!data?.board.is_template,
  );

  // What I may do here. The server computes it (tasks.my_access); all false
  // until it answers, so nothing editable flashes up for a moment.
  const { access, userId } = useMyTaskAccess();
  const spaceCaps = useSpaceCaps(data?.board.space_id);
  const boardAccess = useMemo(
    () => ({ spaceCaps, assigneeCaps: access?.assignee_caps ?? NO_CAPS, myUserId: userId }),
    [spaceCaps, access, userId],
  );

  if (loading) {
    return <TaskListPageSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        اللوحة غير متاحة أو تعذّر تحميلها
      </div>
    );
  }

  const isTemplate = data.board.is_template;

  // Without a view on the whole space (an assignee reaching the board from
  // the sidebar) the board shows only the tasks assigned to me. A task whose
  // parent is not one of mine is shown at the top level. (Row-level security
  // would do this on the server; until then the screen does it.)
  const boardTasks = spaceCaps.view || !userId
    ? data.tasks
    : data.tasks
        .filter((t) => (data.assigneesByTask.get(t.id) ?? []).includes(userId))
        .map((t, _i, mine) =>
          t.parent_task_id && !mine.some((m) => m.id === t.parent_task_id) ? { ...t, parent_task_id: null } : t,
        );
  // Pushing only makes sense on a template, or on a board built from one.
  const canPush = !!syncStatus && (isTemplate || syncStatus.templateBoards.length > 0);
  const pendingTaskIds = canPush && spaceCaps.edit ? syncStatus.pendingTaskIds : [];

  return (
    <TemplateModeProvider value={isTemplate}>
    <TemplateRolesProvider value={isTemplate ? { rolesByTask, setTaskRoles } : null}>
    <BoardAccessProvider value={boardAccess}>
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          {isTemplate && (
            <Link to="/tasks/admin/templates" className="text-gray-400 hover:text-gray-600" title="القوالب">
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <h1 className="text-base font-semibold text-gray-900">{data.board.name}</h1>
          {!isTemplate && (
            <BoardSwitcher spaceId={data.board.space_id} currentBoardId={data.board.id} view={view} />
          )}
          {isTemplate && (
            <span className="flex items-center gap-1 rounded-full bg-primary-superLight px-2 py-0.5 text-xs font-medium text-primary">
              <FileStack className="h-3 w-3" />
              قالب
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-200 text-sm">
            <Link
              to={`/tasks/board/${data.board.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${
                view === "list" ? "bg-primary-superLight font-medium text-primary" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              قائمة
            </Link>
            <Link
              to={`/tasks/board/${data.board.id}/gantt`}
              className={`flex items-center gap-1.5 border-r border-gray-200 px-3 py-1.5 ${
                view === "gantt" ? "bg-primary-superLight font-medium text-primary" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ChartGantt className="h-3.5 w-3.5" />
              مخطط زمني
            </Link>
          </div>
          {!isTemplate && spaceCaps.create && (
            <button
              onClick={() => setShowZoneClone(true)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Copy className="h-3.5 w-3.5" />
              استنساخ منطقة
            </button>
          )}
          {spaceCaps.create && (
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileStack className="h-3.5 w-3.5" />
            استخدام قالب
          </button>
          )}
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
        {view === "gantt" ? (
          <TaskGantt
            key={boardId}
            boardId={data.board.id}
            tasks={boardTasks}
            statuses={data.statuses}
            taskTypes={data.taskTypes}
            dependencies={data.dependencies}
            blockedTaskIds={data.blockedTaskIds}
            onChangeDates={(taskId, change) => updateTaskDates({ taskId, ...change })}
            readOnly={!spaceCaps.edit}
          />
        ) : (
          <TaskTable
            key={boardId}
            boardId={data.board.id}
            boardZoneId={data.board.zone_id}
            zoneName={data.zoneName}
            tasks={boardTasks}
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
            projectId={data.projectId}
            onBulkSetStatus={(taskIds, statusId) => bulkSetStatus({ taskIds, statusId })}
            onBulkSetPriority={(taskIds, priority) => bulkSetPriority({ taskIds, priority })}
            onBulkAssign={(taskIds, add, remove) => bulkAssign({ taskIds, add, remove })}
            onBulkDelete={async (taskIds) => {
              const deletedIds = await bulkDelete({ taskIds });
              // The detail slide-over may be open on a task that just went.
              const openTaskId = location.pathname.match(/\/task\/([^/]+)$/)?.[1];
              if (openTaskId && deletedIds.has(openTaskId)) {
                navigate(location.pathname.replace(/\/task\/[^/]+$/, ""));
              }
            }}
            onPushSelected={canPush && spaceCaps.edit ? setPushTaskIds : undefined}
          />
        )}
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
    </BoardAccessProvider>
    </TemplateRolesProvider>
    </TemplateModeProvider>
  );
}
