import { useMemo, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronsDown, ChevronsUp, ArrowUpDown } from "lucide-react";
import BoardTaskCard from "./BoardTaskCard";
import { usePersistedOpenSet } from "../../../hooks/tasks/usePersistedOpenSet";
import type { EmployeeLite, Priority, StatusRow, TaskTypeLite } from "../../../hooks/tasks/useTaskBoard";
import type { Database } from "../../../lib/supabase";

// Shared filterable, selectably-nested task tree used by the "all
// tasks" and "space tasks" cross-board views (build plan Part 7
// follow-up).
//
// The page supplies a fixed `structuralChain` reflecting real
// containment — [project, space, folder, board] for All Tasks,
// [project, folder, board] for one Space (already scoped, so no space
// level) — always ending in "board". Picking a level from the "تجميع"
// dropdown either (a) starts the tree partway down that chain (pick
// "space" -> space>folder>board; pick "board" -> a flat board list), or
// (b) for a non-structural dimension (status/priority/assignee/type)
// wraps the WHOLE chain under one extra outer layer (pick "assignee" ->
// assignee>project>space>folder>board). Either way the tree always
// bottoms out at Board, which is the one level where "what columns/
// order does this table have" is unambiguous — so every leaf renders as
// the real, fully-editable D2 board table (BoardTaskCard.tsx: same
// TaskTable + useTaskBoard combo the actual board page uses, complete
// with custom columns, drag-reorder, and add-task), never a flat row.
// This is what makes editing coherent under every possible grouping,
// including ones that mix tasks from boards with different schemas —
// you're never asked to edit across boards in one table, only within
// one, however many collapsible layers you drilled through to get there.

export interface FlatTaskRow {
  id: string;
  title: string;
  board_id: string;
  project_id: string | null;
  due_date: string | null;
  is_overdue: boolean;
  priority: Priority | null;
  status_id: string;
  task_type_id: string;
  parent_task_id: string | null;
  created_at: string;
}

export interface TreeLevelDef {
  id: string;
  label: string;
  keyForTask: (task: FlatTaskRow) => string;
  labelForKey: (key: string) => string;
  colorForKey?: (key: string) => string | null;
  iconForKey?: (key: string) => ReactNode;
  /** Custom ordering of the groups that end up on screen; default is alphabetical (ar). */
  orderKeys?: (keys: string[]) => string[];
  /** Keys that shouldn't get their own header — e.g. "no folder" boards attach straight to their parent instead of sitting under an empty "بدون مجلد" wrapper, matching ClickUp's own "Folders are optional" behavior. */
  skipKeys?: string[];
}

interface CountedTreeNode {
  id: string;
  label: string;
  icon: ReactNode | null;
  color: string | null;
  isBoard: boolean;
  boardId?: string;
  taskCount: number;
  children: CountedTreeNode[];
}

type SortMode = "default" | "label" | "count";

// "default" respects each level's own natural order (status by
// sort_order, priority by severity) where one is defined, alphabetical
// otherwise — same as before there was a user-facing sort control.
// "label"/"count" override that at every level once picked.
function orderGroupKeys(level: TreeLevelDef, keys: string[], byKey: Map<string, FlatTaskRow[]>, sortMode: SortMode, sortDir: "asc" | "desc"): string[] {
  const dir = sortDir === "asc" ? 1 : -1;
  if (sortMode === "count") {
    return [...keys].sort((a, b) => ((byKey.get(a)?.length ?? 0) - (byKey.get(b)?.length ?? 0)) * dir);
  }
  if (sortMode === "label") {
    return [...keys].sort((a, b) => level.labelForKey(a).localeCompare(level.labelForKey(b), "ar") * dir);
  }
  return level.orderKeys ? level.orderKeys(keys) : [...keys].sort((a, b) => level.labelForKey(a).localeCompare(level.labelForKey(b), "ar"));
}

function buildTree(tasks: FlatTaskRow[], levels: TreeLevelDef[], sortMode: SortMode, sortDir: "asc" | "desc"): CountedTreeNode[] {
  if (levels.length === 0 || tasks.length === 0) return [];
  const [level, ...rest] = levels;

  const byKey = new Map<string, FlatTaskRow[]>();
  for (const t of tasks) {
    const key = level.keyForTask(t);
    const list = byKey.get(key) ?? [];
    list.push(t);
    byKey.set(key, list);
  }

  const orderedKeys = orderGroupKeys(level, Array.from(byKey.keys()), byKey, sortMode, sortDir);

  const result: CountedTreeNode[] = [];
  for (const key of orderedKeys) {
    const groupTasks = byKey.get(key) ?? [];
    if (level.skipKeys?.includes(key)) {
      // No header for this key — its own children attach straight to
      // this level's parent instead, so a board with no folder shows up
      // directly under its space rather than under an empty wrapper.
      result.push(...buildTree(groupTasks, rest, sortMode, sortDir));
      continue;
    }
    const isBoard = level.id === "board";
    result.push({
      id: `${level.id}:${key}`,
      label: level.labelForKey(key),
      icon: level.iconForKey?.(key) ?? null,
      color: level.colorForKey?.(key) ?? null,
      isBoard,
      boardId: isBoard ? key : undefined,
      taskCount: groupTasks.length,
      children: isBoard ? [] : buildTree(groupTasks, rest, sortMode, sortDir),
    });
  }
  return result;
}

function collectAllNodeIds(nodes: CountedTreeNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectAllNodeIds(n.children)]);
}

type StatusCategory = Database["tasks"]["Enums"]["status_category"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};
export const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
const PRIORITY_COLORS: Record<Priority, string> = { urgent: "#EF4444", high: "#F59E0B", normal: "#3B82F6", low: "#6B7280" };

const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  not_started: "لم تبدأ",
  active: "نشطة",
  done: "منجزة",
  closed: "مغلقة",
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary/40 bg-primary-superLight text-primary"
          : "border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export interface FlatTaskListProps {
  tasks: FlatTaskRow[];
  statusesById: Map<string, StatusRow>;
  employees: EmployeeLite[];
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  /** Real containment order, always ending in "board" — e.g. [project, space, folder, board]. */
  structuralChain: TreeLevelDef[];
  treeStorageKey: string;
  currentUserId: string | undefined;
  emptyLabel: string;
}

export default function FlatTaskList({
  tasks,
  statusesById,
  employees,
  employeesById,
  assigneesByTask,
  taskTypes,
  structuralChain,
  treeStorageKey,
  currentUserId,
  emptyLabel,
}: FlatTaskListProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<StatusCategory>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [taskTypeFilter, setTaskTypeFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all"); // all | mine | unassigned | <userId>
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { isOpen, toggle, openAll, closeAll } = usePersistedOpenSet(treeStorageKey);

  const dimensionLevels = useMemo((): TreeLevelDef[] => {
    const levels: TreeLevelDef[] = [
      {
        id: "status",
        label: "الحالة",
        keyForTask: (t) => t.status_id,
        labelForKey: (key) => statusesById.get(key)?.label_ar ?? "—",
        colorForKey: (key) => statusesById.get(key)?.color ?? null,
        orderKeys: (keys) => [...keys].sort((a, b) => (statusesById.get(a)?.sort_order ?? 0) - (statusesById.get(b)?.sort_order ?? 0)),
      },
      {
        id: "priority",
        label: "الأولوية",
        keyForTask: (t) => t.priority ?? "none",
        labelForKey: (key) => (key === "none" ? "بدون أولوية" : PRIORITY_LABELS[key as Priority]),
        colorForKey: (key) => (key === "none" ? null : PRIORITY_COLORS[key as Priority]),
        orderKeys: (keys) => [...keys].sort((a, b) => (a === "none" ? 99 : PRIORITY_ORDER[a as Priority]) - (b === "none" ? 99 : PRIORITY_ORDER[b as Priority])),
      },
      {
        id: "assignee",
        label: "المسؤول",
        keyForTask: (t) => assigneesByTask.get(t.id)?.[0] ?? "unassigned",
        labelForKey: (key) => {
          if (key === "unassigned") return "غير معين";
          const e = employeesById.get(key);
          return e ? `${e.first_name} ${e.last_name ?? ""}` : "موظف";
        },
      },
      {
        id: "task_type",
        label: "نوع المهمة",
        keyForTask: (t) => t.task_type_id,
        labelForKey: (key) => taskTypes.get(key)?.name_ar ?? "نوع",
        colorForKey: (key) => taskTypes.get(key)?.color ?? null,
      },
    ];
    return levels;
  }, [statusesById, employeesById, assigneesByTask, taskTypes]);

  const [groupBy, setGroupBy] = useState<string>("project");

  const activeLevels = useMemo((): TreeLevelDef[] => {
    const structIdx = structuralChain.findIndex((l) => l.id === groupBy);
    if (structIdx !== -1) return structuralChain.slice(structIdx);
    const dimension = dimensionLevels.find((l) => l.id === groupBy);
    return dimension ? [dimension, ...structuralChain] : structuralChain;
  }, [groupBy, structuralChain, dimensionLevels]);

  const hasActiveFilters =
    statusFilter.size > 0 || priorityFilter.size > 0 || taskTypeFilter.size > 0 || assigneeFilter !== "all" || overdueOnly;

  const clearFilters = () => {
    setStatusFilter(new Set());
    setPriorityFilter(new Set());
    setTaskTypeFilter(new Set());
    setAssigneeFilter("all");
    setOverdueOnly(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (term && !t.title.toLowerCase().includes(term)) return false;
      if (statusFilter.size > 0) {
        const category = statusesById.get(t.status_id)?.category;
        if (!category || !statusFilter.has(category)) return false;
      }
      if (priorityFilter.size > 0) {
        if (!t.priority || !priorityFilter.has(t.priority)) return false;
      }
      if (taskTypeFilter.size > 0 && !taskTypeFilter.has(t.task_type_id)) return false;
      if (overdueOnly && !t.is_overdue) return false;
      if (assigneeFilter !== "all") {
        const assignees = assigneesByTask.get(t.id) ?? [];
        if (assigneeFilter === "unassigned" && assignees.length > 0) return false;
        if (assigneeFilter === "mine" && !(currentUserId && assignees.includes(currentUserId))) return false;
        if (assigneeFilter !== "mine" && assigneeFilter !== "unassigned" && !assignees.includes(assigneeFilter)) return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, taskTypeFilter, overdueOnly, assigneeFilter, assigneesByTask, statusesById, currentUserId]);

  const tree = useMemo(
    () => buildTree(filtered, activeLevels, sortMode, sortDir),
    [filtered, activeLevels, sortMode, sortDir],
  );
  const allNodeIds = useMemo(() => collectAllNodeIds(tree), [tree]);
  const allExpanded = allNodeIds.length > 0 && allNodeIds.every((id) => isOpen(id));

  const taskTypeOptions = Array.from(taskTypes.values());
  const dropdownOptions = [...structuralChain, ...dimensionLevels];

  const renderNode = (node: CountedTreeNode, depth: number): ReactNode => {
    // Deliberately no per-depth indent — ClickUp's own grouped view (see
    // the reference screenshot) keeps every level flush to the same
    // starting edge regardless of nesting; the card boundary and stacking
    // order communicate hierarchy instead of a cascading margin/padding
    // that shifts each level further in and leaves a growing gap.
    if (node.isBoard) {
      return (
        <div key={node.id} className={depth === 0 ? "px-6 mb-3" : "px-6 mb-2"}>
          <BoardTaskCard
            boardId={node.boardId ?? ""}
            boardName={node.label}
            taskCount={node.taskCount}
            open={isOpen(node.id)}
            onToggle={() => toggle(node.id)}
          />
        </div>
      );
    }
    const open = isOpen(node.id);
    return (
      <div key={node.id} className={depth === 0 ? "mb-1" : ""}>
        <button
          onClick={() => toggle(node.id)}
          className="flex w-full items-center gap-2 bg-white px-6 py-2 text-right hover:bg-gray-50"
        >
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
          {node.icon}
          {node.color ? (
            <>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                style={{ background: `${node.color}1A`, color: node.color, border: `1px solid ${node.color}55` }}
              >
                {node.label}
              </span>
              <span className="flex-1" />
            </>
          ) : (
            <span
              className={`flex-1 truncate text-right ${depth === 0 ? "text-sm font-semibold text-gray-800" : "text-sm font-medium text-gray-600"}`}
            >
              {node.label}
            </span>
          )}
          <span className="text-xs font-normal text-gray-400">{node.taskCount}</span>
        </button>
        {open && <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-shrink-0 space-y-2 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مهمة..."
              className="w-full bg-transparent text-sm outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
            <span className="text-xs text-gray-400">تجميع:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              {dropdownOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              <option value="default">ترتيب افتراضي</option>
              <option value="label">الاسم</option>
              <option value="count">عدد المهام</option>
            </select>
            {sortMode !== "default" && (
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="text-xs text-gray-400 hover:text-gray-600"
                title={sortDir === "asc" ? "تصاعدي" : "تنازلي"}
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            )}
          </div>

          <button
            onClick={() => (allExpanded ? closeAll(allNodeIds) : openAll())}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            {allExpanded ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
            {allExpanded ? "طي الكل" : "توسيع الكل"}
          </button>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              showFilters || hasActiveFilters
                ? "border-primary/40 bg-primary-superLight text-primary"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فلاتر
            {hasActiveFilters && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">•</span>}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">الحالة:</span>
              {(Object.keys(STATUS_CATEGORY_LABELS) as StatusCategory[]).map((cat) => (
                <FilterChip key={cat} active={statusFilter.has(cat)} onClick={() => setStatusFilter((s) => toggleInSet(s, cat))}>
                  {STATUS_CATEGORY_LABELS[cat]}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">الأولوية:</span>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <FilterChip key={p} active={priorityFilter.has(p)} onClick={() => setPriorityFilter((s) => toggleInSet(s, p))}>
                  {PRIORITY_LABELS[p]}
                </FilterChip>
              ))}
            </div>

            {taskTypeOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400">النوع:</span>
                {taskTypeOptions.map((tt) => (
                  <FilterChip key={tt.id} active={taskTypeFilter.has(tt.id)} onClick={() => setTaskTypeFilter((s) => toggleInSet(s, tt.id))}>
                    {tt.name_ar}
                  </FilterChip>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">المسؤول:</span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
              >
                <option value="all">الكل</option>
                <option value="mine">أنا</option>
                <option value="unassigned">غير معين</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name ?? ""}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
                المتأخرة فقط
              </label>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="mr-auto text-xs text-gray-400 underline hover:text-gray-600">
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          {filtered.length} من {tasks.length} مهمة
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">{tasks.length === 0 ? emptyLabel : "لا توجد نتائج مطابقة للفلاتر"}</div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
