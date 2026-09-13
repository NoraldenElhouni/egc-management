import { Link } from "react-router-dom";
import { Loader2, Users, Building2, FolderKanban, Building, User, ListChecks } from "lucide-react";
import { useTasksSidebar, type SpaceNode, type SpaceType } from "../../hooks/tasks/useTasksSidebar";

// The /tasks index route — what shows before a space/board is picked.
// D1's actual spec is just "the sidebar" (already built, TasksLayout.tsx),
// so this landing page isn't a numbered D-screen; it's a quick-access hub
// reusing the same sidebar data (spaces/departments/my-work counts)
// instead of a placeholder now that every real screen exists to link to.

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  project: "مساحات المشاريع",
  department: "مساحات الأقسام",
  company: "مساحات الشركة",
  personal: "مساحتي الخاصة",
};
const SPACE_TYPE_ORDER: SpaceType[] = ["project", "department", "company", "personal"];
const SPACE_TYPE_ICONS: Record<SpaceType, typeof FolderKanban> = {
  project: FolderKanban,
  department: Building2,
  company: Building,
  personal: User,
};

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {count} مفتوحة
    </span>
  );
}

function SpaceCard({ node }: { node: SpaceNode }) {
  const Icon = SPACE_TYPE_ICONS[node.space.space_type];
  const boardCount = node.boards.length + node.folders.reduce((n, f) => n + f.boards.length, 0);
  const openCount =
    node.boards.reduce((n, b) => n + b.openCount, 0) +
    node.folders.reduce((n, f) => n + f.boards.reduce((s, b) => s + b.openCount, 0), 0);

  return (
    <Link
      to={`/tasks/space/${node.space.id}/tasks`}
      className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary-superLight/40"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-superLight text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1 truncate font-medium text-gray-800">{node.space.name}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {boardCount > 0 ? `${boardCount} لوحة` : "لا توجد لوحات بعد"}
        </span>
        <CountBadge count={openCount} />
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const { data, loading } = useTasksSidebar();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const spaceGroups = data
    ? SPACE_TYPE_ORDER.map((type) => ({ type, nodes: data.spacesByType[type] })).filter((g) => g.nodes.length > 0)
    : [];

  return (
    <div className="h-full overflow-y-auto p-6" dir="rtl">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">إدارة المهام</h1>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/tasks/all-tasks"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
            <ListChecks className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-medium text-gray-800">كل المهام</div>
            <div className="text-xs text-gray-400">جميع المهام عبر كل المساحات واللوحات</div>
          </div>
        </Link>

        <Link
          to="/tasks/my-work"
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Users className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-medium text-gray-800">أعمالي</div>
            <div className="text-xs text-gray-400">المهام المسندة إليك عبر كل المشاريع</div>
          </div>
          <CountBadge count={data?.myWorkCount ?? 0} />
        </Link>
      </div>

      {!!data?.departments.length && (
        <div className="mb-5">
          <div className="mb-2 text-xs font-semibold text-gray-500">الأقسام</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {data.departments.map((dept) => (
              <Link
                key={dept.id}
                to={`/tasks/department/${dept.id}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary-superLight/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Building2 className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1 truncate font-medium text-gray-800">{dept.name_ar ?? dept.name}</span>
                <CountBadge count={dept.openCount} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {spaceGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا توجد مساحات بعد
        </div>
      ) : (
        spaceGroups.map((group) => (
          <div key={group.type} className="mb-5">
            <div className="mb-2 text-xs font-semibold text-gray-500">{SPACE_TYPE_LABELS[group.type]}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {group.nodes.map((node) => (
                <SpaceCard key={node.space.id} node={node} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
