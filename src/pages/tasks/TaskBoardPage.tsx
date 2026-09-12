import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTaskBoard } from "../../hooks/tasks/useTaskBoard";
import TaskTable from "../../components/tasks/board/TaskTable";

// D2 — Zone board (list view), the main screen (build plan Part 7).
export default function TaskBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
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
  } = useTaskBoard(boardId);

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
      <div className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">{data.board.name}</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <TaskTable
          key={boardId}
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
          onChangeStatus={(taskId, statusId) => updateStatus({ taskId, statusId })}
          onChangePriority={(taskId, priority) => updatePriority({ taskId, priority })}
          onChangeDueDate={(taskId, dueDate) => updateDueDate({ taskId, dueDate })}
          onChangeAssignees={(taskId, userIds) => setAssignees({ taskId, userIds })}
          onCreateTask={(title, parentTaskId) => createTask({ title, parentTaskId })}
          canCreateTask={!!data.projectId}
        />
      </div>
    </div>
  );
}
