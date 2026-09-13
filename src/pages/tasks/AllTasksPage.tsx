import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAllTasksView } from "../../hooks/tasks/useAllTasksView";
import FlatTaskList from "../../components/tasks/list/FlatTaskList";

// "All tasks" — every task across every board/space the user can see, in
// one filterable/sortable list (build plan Part 7 follow-up). Private
// spaces are excluded unless the current user owns/is a member of them —
// see useAllTasksView.ts's header for the exact rule.
export default function AllTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useAllTasksView();

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
        تعذّر تحميل المهام
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="border-b border-gray-100 px-6 py-4">
        <h1 className="text-base font-semibold text-gray-900">كل المهام</h1>
        <p className="mt-0.5 text-xs text-gray-400">جميع المهام عبر كل المساحات واللوحات المتاحة لك</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <FlatTaskList
          tasks={data.tasks}
          statusesById={data.statusesById}
          employees={data.employees}
          employeesById={data.employeesById}
          assigneesByTask={data.assigneesByTask}
          taskTypes={data.taskTypes}
          subtaskProgressByTask={data.subtaskProgressByTask}
          projectNameById={data.projectNameById}
          groupOptions={data.spaces.map((s) => ({ id: s.id, label: s.name }))}
          groupIdForTask={(task) => data.spaceByTask.get(task.id)}
          groupColumnLabel="المساحة"
          secondaryLabelForTask={(task) => data.boardNameById.get(task.board_id)}
          onOpenTask={(taskId) => navigate(`/tasks/all-tasks/task/${taskId}`)}
          onOpenBoard={(boardId) => navigate(`/tasks/board/${boardId}`)}
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام بعد"
        />
      </div>

      <Outlet />
    </div>
  );
}
