import { useMemo, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useTaskDirectory } from "../../hooks/tasks/useTaskDirectory";
import { useTasksSidebar } from "../../hooks/tasks/useTasksSidebar";
import DirectoryTaskRow, { directoryRowGridStyle } from "../../components/tasks/board/DirectoryTaskRow";
import DirectoryFilterSortPopover from "../../components/tasks/board/DirectoryFilterSortPopover";
import CollapseAllButtons from "../../components/tasks/board/CollapseAllButtons";
import OverdueNotifyButton from "../../components/tasks/board/OverdueNotifyButton";
import {
  countActiveFilters,
  createDefaultFilters,
  DEFAULT_SORT,
  filterDirectoryTasks,
  searchDirectoryTasks,
  sortDirectoryGroups,
  sortDirectoryTasks,
  type DirectoryFilterState,
  type DirectorySortState,
} from "../../components/tasks/board/directoryFilters";
import type { TaskRow } from "../../hooks/tasks/useTaskBoard";

// "All tasks in this space" — same full inline-edit/filter/sort shape as
// AssigneeViewPage.tsx/TaskTypeViewPage.tsx/ProjectViewPage.tsx, but
// scoped to one space (useTaskDirectory({ spaceId })) instead of
// company-wide, and grouped by board — a space's own direct sub-units,
// matching how the sidebar tree already organizes it. Reached from the
// sidebar's space name/icon (TasksLayout.tsx's SpaceSection — the small
// chevron still just expands/collapses the inline board tree) and from
// TasksPage.tsx's space cards.

interface BoardGroup {
  key: string;
  label: string;
  tasks: TaskRow[];
}

// Same add-row UI/behavior as board/TaskTable.tsx's own bottom-of-list
// input — own local draft state since each board group needs an
// independent one.
function AddTaskRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");

  const submit = () => {
    const trimmed = title.trim();
    if (trimmed) onAdd(trimmed);
    setTitle("");
  };

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
      <Plus className="h-3.5 w-3.5 text-gray-400" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setTitle("");
        }}
        onBlur={submit}
        placeholder="إضافة مهمة..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

export default function SpaceTasksPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { data, loading, error, ...mutations } = useTaskDirectory({ spaceId });
  const { data: sidebarData } = useTasksSidebar();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DirectoryFilterState>(createDefaultFilters());
  const [sort, setSort] = useState<DirectorySortState>(DEFAULT_SORT);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const searching = search.trim().length > 0;

  const spaceNode = useMemo(() => {
    if (!sidebarData) return null;
    for (const nodes of Object.values(sidebarData.spacesByType)) {
      const found = nodes.find((n) => n.space.id === spaceId);
      if (found) return found;
    }
    return null;
  }, [sidebarData, spaceId]);

  const activeFilterCount = countActiveFilters(filters);

  // One definition of "what this page is showing" — shared with the
  // overdue-notify button so its recipients match the visible list.
  const visibleTasks = useMemo(
    () => (data ? searchDirectoryTasks(filterDirectoryTasks(data.tasks, filters, data), search) : []),
    [data, filters, search],
  );

  const groups = useMemo<BoardGroup[]>(() => {
    if (!data) return [];

    // Seeded from every board in the space (data.boardNamesById), not
    // just boards with a surviving task — otherwise a brand-new board
    // would have no section, and so no add-task row to add its first
    // task from. Only while the view is neutral (no search, no active
    // filter): once someone's actually narrowing things down, an empty
    // board would just be noise among real results.
    const byBoard = new Map<string, TaskRow[]>();
    if (!searching && activeFilterCount === 0) {
      for (const boardId of data.boardNamesById.keys()) byBoard.set(boardId, []);
    }
    for (const task of visibleTasks) {
      const list = byBoard.get(task.board_id) ?? [];
      list.push(task);
      byBoard.set(task.board_id, list);
    }

    const boardGroups: BoardGroup[] = Array.from(byBoard.entries()).map(([boardId, tasks]) => ({
      key: boardId,
      label: data.boardNamesById.get(boardId) ?? "لوحة",
      tasks: sortDirectoryTasks(tasks, sort.taskSort, data),
    }));

    return sortDirectoryGroups(boardGroups, sort.groupSort);
  }, [data, visibleTasks, searching, sort, activeFilterCount]);

  const expandAll = () => setCollapsedKeys(new Set());
  const collapseAll = () => setCollapsedKeys(new Set(groups.map((g) => g.key)));

  const toggle = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const spaceColor = spaceNode?.space.color ?? null;

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <h1 className="shrink-0 text-base font-semibold text-gray-900" style={spaceColor ? { color: spaceColor } : undefined}>
          {spaceNode?.space.name ?? "المساحة"}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex w-56 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مهمة..."
              className="w-full bg-transparent text-sm outline-none"
              aria-label="بحث عن مهمة"
            />
          </div>
          <CollapseAllButtons onExpandAll={expandAll} onCollapseAll={collapseAll} searching={searching} />
          <OverdueNotifyButton visibleTasks={visibleTasks} data={data} filters={filters} searchTerm={search} />
          <button
            onClick={() => setShowFilterDialog(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فلترة وترتيب
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilterDialog && (
        <DirectoryFilterSortPopover
          filters={filters}
          onChangeFilters={setFilters}
          sort={sort}
          onChangeSort={setSort}
          data={data}
          onClose={() => setShowFilterDialog(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
        {groups.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            {searching || activeFilterCount > 0 ? "لا توجد مهام مطابقة" : "لا توجد مهام في هذه المساحة بعد"}
          </div>
        ) : (
          groups.map((group) => {
            const collapsed = !searching && collapsedKeys.has(group.key);
            return (
              <div key={group.key} className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white last:mb-0">
                <button
                  onClick={() => toggle(group.key)}
                  className="flex w-full items-center gap-2 border-b-2 border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                >
                  {collapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span>{group.label}</span>
                  <span className="text-xs font-normal text-gray-400">({group.tasks.length})</span>
                </button>

                {!collapsed && (
                  <>
                    <div
                      style={directoryRowGridStyle()}
                      className="border-b border-gray-100 bg-white px-2 py-1.5 text-xs font-semibold text-gray-500"
                    >
                      <div>عنوان المهمة</div>
                      <div>الحالة</div>
                      <div>الأولوية</div>
                      <div>الفريق</div>
                      <div>تاريخ البدء</div>
                      <div>الاستحقاق</div>
                    </div>
                    {group.tasks.map((task) => (
                      <DirectoryTaskRow
                        key={task.id}
                        task={task}
                        statuses={data.statuses}
                        employeesById={data.employeesById}
                        allEmployees={data.allEmployees}
                        assigneesByTask={data.assigneesByTask}
                        taskTypes={data.taskTypes}
                        tagsByTask={data.tagsByTask}
                        parentTitle={data.parentTitleByTask.get(task.id)}
                        linkedTaskIds={data.linkedTaskIds}
                        blockedTaskIds={data.blockedTaskIds}
                        dependencyClearedTaskIds={data.dependencyClearedTaskIds}
                        unmetRequirementTaskIds={data.unmetRequirementTaskIds}
                        attachedTaskIds={data.attachedTaskIds}
                        commentedTaskIds={data.commentedTaskIds}
                        onOpenTask={(taskId) => navigate(`/tasks/space/${spaceId}/task/${taskId}`)}
                        {...mutations}
                      />
                    ))}
                    {group.tasks.length === 0 && (
                      <div className="px-3 py-3 text-center text-sm text-gray-400">لا توجد مهام في هذه اللوحة بعد</div>
                    )}
                    <AddTaskRow onAdd={(title) => mutations.onCreateTask(group.key, title)} />
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <Outlet />
    </div>
  );
}
