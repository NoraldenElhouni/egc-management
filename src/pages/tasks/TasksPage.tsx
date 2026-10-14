import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { Users, UserCog, Shapes, Building2, FolderKanban, Building, User, Search, X, Layers, Plus, Settings } from "lucide-react";
import { useTasksSidebar, type BoardWithCount, type SpaceNode, type SpaceType } from "../../hooks/tasks/useTasksSidebar";
import { matchSpaceNode } from "../../hooks/tasks/tasksSidebarSearch";
import { useMyTaskAccess, useSpaceCaps } from "../../hooks/tasks/useTaskAccess";
import NewBoardModal from "../../components/sidebar/NewBoardModal";
import { SpaceCardsPageSkeleton } from "../../components/tasks/TasksSkeletons";
import ProjectsDueDateTimeline from "../../components/project/ProjectsDueDateTimeline";
import { useProjects, type ProjectExecution } from "../../hooks/execution-management/project/useProjects";
import { useProjectTaskEnds } from "../../hooks/tasks/useProjectTaskEnds";
import { formatDate } from "../../utils/helpper";

// The /tasks index route — what shows before a space/board is picked.
// D1's actual spec is just "the sidebar" (already built, TasksLayout.tsx),
// so this landing page isn't a numbered D-screen; it's a quick-access hub
// reusing the same sidebar data (spaces/my-work counts)
// instead of a placeholder now that every real screen exists to link to.
//
// The search box filters the space cards by project name, space name or
// board name (matching logic shared with the sidebar search:
// hooks/tasks/tasksSidebarSearch.ts). While a term is typed the view
// shortcuts step aside so the page shows only results.
//
// At the top, the slim delivery timeline (ProjectsDueDateTimeline, compact)
// of the projects whose task space I can open: each sits at the end of its
// last task (useProjectTaskEnds — the plan end its space's Gantt shows), or
// at its estimated due date while it has no dated tasks. Its card shows both
// dates, flagged when the tasks run past the estimate; a project opens its
// space.

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

function ViewCard({
  to,
  icon: Icon,
  label,
  subtitle,
  badge,
}: {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary-superLight/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-superLight text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-800">{label}</div>
        <div className="truncate text-xs text-gray-400">{subtitle}</div>
      </div>
      {badge}
    </Link>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {count} مفتوحة
    </span>
  );
}

/** Calendar days the tasks end after the estimated due date (0 when not later). */
function lateDays(taskEnd: string | null | undefined, estimate: string | null): number {
  if (!taskEnd || !estimate) return 0;
  const days = Math.round((Date.parse(taskEnd.slice(0, 10)) - Date.parse(estimate.slice(0, 10))) / 86_400_000);
  return Math.max(days, 0);
}

/** A project's two dates in its timeline card: where its tasks end, and its estimate. */
function ProjectEndDates({ taskEnd, estimate }: { taskEnd: string | undefined; estimate: string | null }) {
  const late = lateDays(taskEnd, estimate);
  return (
    <span className="mt-0.5 block text-[10px] leading-4 text-gray-500">
      <span className="block">{taskEnd ? `نهاية المهام: ${formatDate(taskEnd)}` : "لا توجد مهام مجدولة"}</span>
      {estimate && <span className="block">التسليم المتوقع: {formatDate(estimate)}</span>}
      {late > 0 && <span className="block font-medium text-rose-700">بعد التسليم المتوقع بـ {late} يوم</span>}
    </span>
  );
}

function SpaceCard({ node, matchedBoards }: { node: SpaceNode; matchedBoards?: BoardWithCount[] }) {
  const Icon = SPACE_TYPE_ICONS[node.space.space_type];
  const boardCount = node.boards.length + node.folders.reduce((n, f) => n + f.boards.length, 0);
  const openCount =
    node.boards.reduce((n, b) => n + b.openCount, 0) +
    node.folders.reduce((n, f) => n + f.boards.reduce((s, b) => s + b.openCount, 0), 0);
  // Only worth a line of its own when it says something the title doesn't.
  const showProject = !!node.projectName && node.projectName !== node.space.name;
  // With the space tree gone from the sidebar, the card is where a space's
  // settings are opened and boards are added.
  const caps = useSpaceCaps(node.space.id);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const hasActions = caps.create || caps.manage;

  return (
    <div>
      <div className="relative">
      <Link
        to={`/tasks/space/${node.space.id}`}
        className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary-superLight/40"
      >
        <div className={`flex items-center gap-2 ${hasActions ? "pl-16" : ""}`}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-superLight text-primary"
            style={node.space.color ? { backgroundColor: `${node.space.color}1A`, color: node.space.color } : undefined}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-gray-800">{node.space.name}</div>
            {showProject && <div className="truncate text-xs text-gray-400">المشروع: {node.projectName}</div>}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {boardCount > 0 ? `${boardCount} لوحة` : "لا توجد لوحات بعد"}
          </span>
          <CountBadge count={openCount} />
        </div>
      </Link>
      {/* Siblings of the link, not children: a button can't live inside a link. */}
      {hasActions && (
        <div className="absolute left-2 top-2 flex items-center gap-0.5">
          {caps.create && (
            <button
              onClick={() => setShowNewBoard(true)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="لوحة جديدة"
              aria-label="لوحة جديدة"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {caps.manage && (
            <Link
              to={`/tasks/space/${node.space.id}/settings`}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="إعدادات المساحة"
              aria-label="إعدادات المساحة"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
      </div>
      {showNewBoard && <NewBoardModal spaceId={node.space.id} onClose={() => setShowNewBoard(false)} />}
      {/* Siblings of the card link, not children: a link can't nest a link. */}
      {!!matchedBoards?.length && (
        <div className="mr-4 mt-1 space-y-0.5 border-r border-gray-100 pr-2">
          {matchedBoards.map((b) => (
            <Link
              key={b.board.id}
              to={`/tasks/board/${b.board.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate">
                {b.board.name}
                {b.zoneName && <span className="text-xs text-gray-400"> ({b.zoneName})</span>}
              </span>
              <CountBadge count={b.openCount} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { data, loading } = useTasksSidebar();
  const { access } = useMyTaskAccess();
  const [search, setSearch] = useState("");
  const searching = search.trim().length > 0;

  // Someone who can see no space at all (only tasks assigned to them) lands
  // on their own work instead of an empty hub.
  const onlyOwnTasks = !!access && !access.view_all && Object.keys(access.spaces).length === 0;

  // Per space type: the spaces that match (by project / space / board name),
  // each with the boards that matched, so a board hit is reachable straight
  // from here instead of only through its space.
  const searchGroups = useMemo(() => {
    if (!data || !searching) return [];
    return SPACE_TYPE_ORDER.map((type) => ({
      type,
      results: data.spacesByType[type].flatMap((node) => {
        const match = matchSpaceNode(node, search);
        return match ? [{ node, boards: match.boards }] : [];
      }),
    })).filter((g) => g.results.length > 0);
  }, [data, search, searching]);

  // The delivery timeline: projects whose task space I can open (the same
  // rule as the space cards below), each linked to that space.
  const { data: projects } = useProjects();
  const timeline = useMemo(() => {
    const spaceByProject = new Map<string, string>();
    for (const node of data?.spacesByType.project ?? []) {
      const projectId = node.space.project_id;
      if (projectId && access?.spaces[node.space.id] && !spaceByProject.has(projectId)) {
        spaceByProject.set(projectId, node.space.id);
      }
    }
    return {
      spaceByProject,
      projects: (projects ?? []).filter((p) => spaceByProject.has(p.id)),
    };
  }, [data, access, projects]);
  const { taskEnds, loading: taskEndsLoading } = useProjectTaskEnds(Array.from(timeline.spaceByProject.keys()));
  const taskEndOf = useCallback(
    (p: ProjectExecution) => taskEnds?.get(p.id) ?? p.estimated_due_date,
    [taskEnds],
  );

  if (onlyOwnTasks) return <Navigate to="/tasks/my-work" replace />;
  if (loading) {
    return <SpaceCardsPageSkeleton />;
  }

  // The cross-space views (by employee / type / project, departments) are for
  // people who can see more than their own tasks. Space cards: only spaces I
  // hold a level on (a space visible just because it holds a task of mine is
  // reached from the sidebar's board link, and its page would refuse me).
  const canBrowse = !!access && (access.view_all || Object.keys(access.spaces).length > 0);
  const spaceGroups = data
    ? SPACE_TYPE_ORDER.map((type) => ({
        type,
        nodes: data.spacesByType[type].filter((n) => !!access?.spaces[n.space.id]),
      })).filter((g) => g.nodes.length > 0)
    : [];

  return (
    <div className="h-full overflow-y-auto p-6" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">إدارة المهام</h1>
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالمشروع أو المساحة أو اللوحة..."
            className="w-full bg-transparent text-sm outline-none"
            aria-label="بحث بالمشروع أو المساحة أو اللوحة"
          />
          {searching && (
            <button onClick={() => setSearch("")} className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100" title="مسح البحث">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* waits for the task ends, so pills don't jump from the estimate to the plan end */}
      {!searching && timeline.projects.length > 0 && !taskEndsLoading && (
        <ProjectsDueDateTimeline
          variant="compact"
          title="مواعيد انتهاء المشاريع حسب المهام"
          projects={timeline.projects}
          dueDateOf={taskEndOf}
          projectHref={(p) => `/tasks/space/${timeline.spaceByProject.get(p.id)}`}
          isLate={(p) => lateDays(taskEnds?.get(p.id), p.estimated_due_date) > 0}
          renderProjectDetail={(p) => <ProjectEndDates taskEnd={taskEnds?.get(p.id)} estimate={p.estimated_due_date} />}
        />
      )}

      {searching && searchGroups.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا توجد نتائج مطابقة
        </div>
      )}
      {searching &&
        searchGroups.map((group) => (
          <div key={group.type} className="mb-5">
            <div className="mb-2 text-xs font-semibold text-gray-500">{SPACE_TYPE_LABELS[group.type]}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {group.results.map(({ node, boards }) => (
                <SpaceCard key={node.space.id} node={node} matchedBoards={boards} />
              ))}
            </div>
          </div>
        ))}

      {!searching && (
        <div className="mb-5">
          <div className="mb-2 text-xs font-semibold text-gray-500">طرق العرض</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            <ViewCard
              to="/tasks/my-work"
              icon={Users}
              label="أعمالي"
              subtitle="المهام المسندة إليك عبر كل المشاريع"
              badge={<CountBadge count={data?.myWorkCount ?? 0} />}
            />
            {canBrowse && (
              <>
                <ViewCard
                  to="/tasks/by-assignee"
                  icon={UserCog}
                  label="حسب الموظف"
                  subtitle="كل المهام مجمّعة حسب الموظف المسؤول"
                />
                <ViewCard
                  to="/tasks/by-type"
                  icon={Shapes}
                  label="حسب نوع المهمة"
                  subtitle="كل المهام مجمّعة حسب نوع المهمة"
                />
                <ViewCard
                  to="/tasks/by-project"
                  icon={FolderKanban}
                  label="حسب المشروع"
                  subtitle="كل المهام مجمّعة حسب المشروع والمنطقة"
                />
              </>
            )}
          </div>
        </div>
      )}

      {!searching && spaceGroups.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا توجد مساحات بعد
        </div>
      )}
      {!searching &&
        spaceGroups.map((group) => (
          <div key={group.type} className="mb-5">
            <div className="mb-2 text-xs font-semibold text-gray-500">{SPACE_TYPE_LABELS[group.type]}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {group.nodes.map((node) => (
                <SpaceCard key={node.space.id} node={node} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
