import { useCallback } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router-dom";
import { Loader2, Settings, Folder, Layers } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSpaceTasksView } from "../../hooks/tasks/useSpaceTasksView";
import FlatTaskList, { type FlatTaskRow, type TreeNode } from "../../components/tasks/list/FlatTaskList";

// "Space tasks" — every task across every board (and folder) of one
// space, grouped as a collapsible folder (optional) > board > tasks
// tree — one level shallower than AllTasksPage.tsx since the space
// itself is already the context (build plan Part 7 follow-up).
export default function SpaceTasksPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useSpaceTasksView(spaceId);

  const buildTree = useCallback(
    (filteredTasks: FlatTaskRow[]): TreeNode[] => {
      if (!data) return [];

      const tasksByBoard = new Map<string, FlatTaskRow[]>();
      for (const t of filteredTasks) {
        const list = tasksByBoard.get(t.board_id) ?? [];
        list.push(t);
        tasksByBoard.set(t.board_id, list);
      }

      const boardNode = (board: (typeof data.boards)[number]): TreeNode => ({
        id: board.id,
        label: board.name,
        icon: <Layers className="h-3.5 w-3.5 shrink-0 text-gray-400" />,
        children: [],
        tasks: tasksByBoard.get(board.id) ?? [],
        onOpenExternal: () => navigate(`/tasks/board/${board.id}`),
      });

      const folderNodes: TreeNode[] = data.folders.map((folder) => ({
        id: folder.id,
        label: folder.name,
        icon: <Folder className="h-3.5 w-3.5 shrink-0 text-gray-400" />,
        children: data.boards.filter((b) => b.folder_id === folder.id).map(boardNode),
        tasks: [],
      }));
      const directBoardNodes = data.boards.filter((b) => !b.folder_id).map(boardNode);

      return [...folderNodes, ...directBoardNodes];
    },
    [data, navigate],
  );

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
          buildTree={buildTree}
          treeStorageKey="tasksTreeOpenNodes"
          onOpenTask={(taskId) => navigate(`/tasks/space/${spaceId}/tasks/task/${taskId}`)}
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام في هذه المساحة بعد"
        />
      </div>

      <Outlet />
    </div>
  );
}
