import { useMemo } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router-dom";
import { Loader2, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSpaceTasksView } from "../../hooks/tasks/useSpaceTasksView";
import FlatTaskList, { type GroupByOption } from "../../components/tasks/list/FlatTaskList";

// "Space tasks" — every task across every board of one space,
// filterable/sortable/grouped (default: by Status) — one level
// shallower than AllTasksPage.tsx since the space itself is already the
// context, so there's no "group by space" option here.
export default function SpaceTasksPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useSpaceTasksView(spaceId);

  const boardNameById = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.name])), [data?.boards]);
  const folderNameById = useMemo(() => new Map((data?.folders ?? []).map((f) => [f.id, f.name])), [data?.folders]);
  const folderIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.folder_id])), [data?.boards]);

  const extraGroupOptions = useMemo((): GroupByOption[] => [
    {
      value: "board",
      label: "اللوحة",
      keyForTask: (t) => t.board_id,
      labelForKey: (key) => boardNameById.get(key) ?? "—",
    },
    {
      value: "folder",
      label: "المجلد",
      keyForTask: (t) => folderIdByBoard.get(t.board_id) ?? "none",
      labelForKey: (key) => (key === "none" ? "بدون مجلد" : (folderNameById.get(key) ?? "—")),
    },
  ], [boardNameById, folderIdByBoard, folderNameById]);

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
          extraGroupOptions={extraGroupOptions}
          secondaryLabelForTask={(task) => boardNameById.get(task.board_id)}
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
