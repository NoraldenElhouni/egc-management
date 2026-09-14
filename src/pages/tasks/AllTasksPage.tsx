import { useMemo } from "react";
import { Loader2, FolderKanban, Building2, Building, User, Folder, Layers } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAllTasksView, type TreeSpace } from "../../hooks/tasks/useAllTasksView";
import FlatTaskList, { type TreeLevelDef } from "../../components/tasks/list/FlatTaskList";

// "All tasks" — every task across every board/space the user can see.
// structuralChain = [project, space, folder, board], real containment
// order — see FlatTaskList.tsx's header for how the "تجميع" dropdown
// picks where in (or above) this chain the tree starts. Private spaces
// are excluded unless the current user owns/is a member of them — see
// useAllTasksView.ts.

const SPACE_TYPE_ICONS: Record<TreeSpace["space_type"], typeof FolderKanban> = {
  project: FolderKanban,
  department: Building2,
  company: Building,
  personal: User,
};

export default function AllTasksPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAllTasksView();

  const spaceIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.space_id])), [data?.boards]);
  const folderIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.folder_id])), [data?.boards]);
  const spaceById = useMemo(() => new Map((data?.spaces ?? []).map((s) => [s.id, s])), [data?.spaces]);
  const folderNameById = useMemo(() => new Map((data?.folders ?? []).map((f) => [f.id, f.name])), [data?.folders]);
  const boardNameById = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.name])), [data?.boards]);
  const projectNameById = data?.projectNameById ?? new Map<string, string>();

  const structuralChain = useMemo((): TreeLevelDef[] => [
    {
      id: "project",
      label: "المشروع",
      keyForTask: (t) => t.project_id ?? "none",
      labelForKey: (key) => (key === "none" ? "بدون مشروع" : (projectNameById.get(key) ?? "مشروع")),
    },
    {
      id: "space",
      label: "المساحة",
      keyForTask: (t) => spaceIdByBoard.get(t.board_id) ?? "none",
      labelForKey: (key) => spaceById.get(key)?.name ?? "—",
      iconForKey: (key) => {
        const type = spaceById.get(key)?.space_type;
        const Icon = type ? SPACE_TYPE_ICONS[type] : FolderKanban;
        return <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />;
      },
    },
    {
      id: "folder",
      label: "المجلد",
      keyForTask: (t) => folderIdByBoard.get(t.board_id) ?? "none",
      labelForKey: (key) => (key === "none" ? "بدون مجلد" : (folderNameById.get(key) ?? "—")),
      iconForKey: () => <Folder className="h-3.5 w-3.5 shrink-0 text-gray-400" />,
      skipKeys: ["none"],
    },
    {
      id: "board",
      label: "اللوحة",
      keyForTask: (t) => t.board_id,
      labelForKey: (key) => boardNameById.get(key) ?? "—",
      iconForKey: () => <Layers className="h-3.5 w-3.5 shrink-0 text-gray-400" />,
    },
  ], [spaceIdByBoard, folderIdByBoard, spaceById, folderNameById, boardNameById, projectNameById]);

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
    <div className="flex h-full flex-col bg-white" dir="rtl">
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
          structuralChain={structuralChain}
          treeStorageKey="allTasksTreeClosedNodes"
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام بعد"
        />
      </div>
    </div>
  );
}
