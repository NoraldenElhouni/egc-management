import { useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2, FolderKanban, Building2, Building, User, Folder, Layers } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAllTasksView, type TreeSpace } from "../../hooks/tasks/useAllTasksView";
import FlatTaskList, { type FlatTaskRow, type TreeNode } from "../../components/tasks/list/FlatTaskList";

// "All tasks" — every task across every board/space the user can see,
// grouped as a collapsible space > folder (optional) > board > tasks
// tree, ClickUp's own "Everything" view (build plan Part 7 follow-up).
// Private spaces are excluded unless the current user owns/is a member
// of them — see useAllTasksView.ts's header for the exact rule.

const SPACE_TYPE_ICONS: Record<TreeSpace["space_type"], typeof FolderKanban> = {
  project: FolderKanban,
  department: Building2,
  company: Building,
  personal: User,
};

export default function AllTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useAllTasksView();

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

      return data.spaces.map((space): TreeNode => {
        const spaceBoards = data.boards.filter((b) => b.space_id === space.id);
        const spaceFolders = data.folders.filter((f) => f.space_id === space.id);
        const Icon = SPACE_TYPE_ICONS[space.space_type];

        const folderNodes: TreeNode[] = spaceFolders.map((folder) => ({
          id: folder.id,
          label: folder.name,
          icon: <Folder className="h-3.5 w-3.5 shrink-0 text-gray-400" />,
          children: spaceBoards.filter((b) => b.folder_id === folder.id).map(boardNode),
          tasks: [],
        }));
        const directBoardNodes = spaceBoards.filter((b) => !b.folder_id).map(boardNode);

        return {
          id: space.id,
          label: space.name,
          icon: <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />,
          children: [...folderNodes, ...directBoardNodes],
          tasks: [],
        };
      });
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
          buildTree={buildTree}
          treeStorageKey="tasksTreeOpenNodes"
          onOpenTask={(taskId) => navigate(`/tasks/all-tasks/task/${taskId}`)}
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام بعد"
        />
      </div>

      <Outlet />
    </div>
  );
}
