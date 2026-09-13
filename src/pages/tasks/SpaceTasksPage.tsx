import { Outlet, useNavigate, useParams, Link } from "react-router-dom";
import { Loader2, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSpaceTasksView } from "../../hooks/tasks/useSpaceTasksView";
import FlatTaskList from "../../components/tasks/list/FlatTaskList";

// "Space tasks" — every task across every board of one space, one
// filterable/sortable list instead of picking a board first (build plan
// Part 7 follow-up, pairs with AllTasksPage.tsx).
export default function SpaceTasksPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useSpaceTasksView(spaceId);

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
        تعذّر تحميل مهام المساحة
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{data.space.name}</h1>
          <p className="mt-0.5 text-xs text-gray-400">كل المهام عبر لوحات هذه المساحة</p>
        </div>
        <Link
          to={`/tasks/space/${spaceId}/settings`}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Settings className="h-3.5 w-3.5" />
          إعدادات المساحة
        </Link>
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
          groupOptions={data.boards.map((b) => ({ id: b.id, label: b.name }))}
          groupIdForTask={(task) => task.board_id}
          groupColumnLabel="اللوحة"
          onOpenTask={(taskId) => navigate(`/tasks/space/${spaceId}/tasks/task/${taskId}`)}
          onOpenBoard={(boardId) => navigate(`/tasks/board/${boardId}`)}
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام في هذه المساحة بعد"
        />
      </div>

      <Outlet />
    </div>
  );
}
