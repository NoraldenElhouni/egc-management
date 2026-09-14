import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Settings, Folder, Layers } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSpaceTasksView } from "../../hooks/tasks/useSpaceTasksView";
import FlatTaskList, { type TreeLevelDef } from "../../components/tasks/list/FlatTaskList";

// "Space tasks" — every task across every board of one space.
// structuralChain = [project, folder, board] — one level shallower than
// AllTasksPage.tsx's [project, space, folder, board] since the space
// itself is already the context. Project still applies: a department/
// company space's tasks can carry different project_ids per task (the
// space itself isn't 1:1 with a project the way a project-space is).
export default function SpaceTasksPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user } = useAuth();
  const { data, loading, error } = useSpaceTasksView(spaceId);

  const folderIdByBoard = useMemo(() => new Map((data?.boards ?? []).map((b) => [b.id, b.folder_id])), [data?.boards]);
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
  ], [folderIdByBoard, folderNameById, boardNameById, projectNameById]);

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
    <div className="flex h-full flex-col bg-white" dir="rtl">
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
          structuralChain={structuralChain}
          treeStorageKey="spaceTasksTreeClosedNodes"
          currentUserId={user?.id}
          emptyLabel="لا توجد مهام في هذه المساحة بعد"
        />
      </div>
    </div>
  );
}
