import { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAllTasksView } from "../../hooks/tasks/useAllTasksView";
import FlatTaskList, { type GroupByOption } from "../../components/tasks/list/FlatTaskList";

// "All tasks" — every task across every board/space the user can see,
// filterable/sortable/grouped (default: by Status, ClickUp's own
// default for a cross-scope view — confirmed via research, see
// FlatTaskList.tsx's header). Private spaces are excluded unless the
// current user owns/is a member of them — see useAllTasksView.ts.
export default function AllTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useAllTasksView();

  const boardNameById = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.name])), [data?.boards]);
  const spaceNameById = useMemo(() => new Map((data?.spaces ?? []).map((s) => [s.id, s.name])), [data?.spaces]);
  const spaceIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.space_id])), [data?.boards]);
  const folderNameById = useMemo(() => new Map((data?.folders ?? []).map((f) => [f.id, f.name])), [data?.folders]);
  const folderIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.folder_id])), [data?.boards]);

  const extraGroupOptions = useMemo((): GroupByOption[] => [
    {
      value: "space",
      label: "المساحة",
      keyForTask: (t) => spaceIdByBoard.get(t.board_id) ?? "",
      labelForKey: (key) => spaceNameById.get(key) ?? "—",
    },
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
  ], [spaceIdByBoard, spaceNameById, boardNameById, folderIdByBoard, folderNameById]);

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
          extraGroupOptions={extraGroupOptions}
          secondaryLabelForTask={(task) => {
            const spaceId = spaceIdByBoard.get(task.board_id);
            const spaceName = spaceId ? spaceNameById.get(spaceId) : undefined;
            const boardName = boardNameById.get(task.board_id);
            return [spaceName, boardName].filter(Boolean).join(" · ") || undefined;
          }}
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
