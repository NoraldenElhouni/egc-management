import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, X, ExternalLink } from "lucide-react";
import Badge, { type BadgeVariant } from "../../ui/Badge";
import Tooltip from "../../ui/Tooltip";
import type { EmployeeLite, Priority, StatusRow, TaskTypeLite } from "../../../hooks/tasks/useTaskBoard";
import type { Database } from "../../../lib/supabase";

// Shared flat, filterable/sortable task list used by the "all tasks" and
// "space tasks" cross-board views (build plan Part 7 follow-up). D2's
// TaskTable is board-scoped and per-board-custom-field aware; this is
// deliberately simpler (only the fields every task has, regardless of
// board) since it spans boards that may not share a schema of custom
// columns at all.

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

type StatusCategory = Database["tasks"]["Enums"]["status_category"];

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};
const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  urgent: "danger",
  high: "warning",
  normal: "info",
  low: "default",
};
const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  not_started: "لم تبدأ",
  active: "نشطة",
  done: "منجزة",
  closed: "مغلقة",
};
const STATUS_CATEGORY_ORDER: Record<StatusCategory, number> = { not_started: 0, active: 1, done: 2, closed: 3 };

type SortKey = "due_date" | "priority" | "title" | "created_at" | "status";
const SORT_LABELS: Record<SortKey, string> = {
  due_date: "تاريخ الاستحقاق",
  priority: "الأولوية",
  title: "العنوان",
  created_at: "تاريخ الإنشاء",
  status: "الحالة",
};

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
function pillStyle(hex: string | null) {
  const color = hex ?? "#6B7280";
  return { background: `${color}1A`, color, border: `1px solid ${color}55` };
}
function formatDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
}

function dayWord(n: number): string {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

// "متبقي 3 أيام" / "اليوم" / "متأخر يومين" next to the due date — the
// date alone didn't answer the question people actually look at a due
// date to answer ("how soon"), and made them do the subtraction by eye.
function daysRemainingLabel(dueDate: string): { text: string; tone: "overdue" | "today" | "upcoming" } {
  const due = new Date(dueDate);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const now = new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((dueMidnight - nowMidnight) / 86_400_000);

  if (diffDays === 0) return { text: "اليوم", tone: "today" };
  if (diffDays > 0) return { text: `متبقي ${dayWord(diffDays)}`, tone: "upcoming" };
  return { text: `متأخر ${dayWord(Math.abs(diffDays))}`, tone: "overdue" };
}

// Groups the row's meta chunks with a thin vertical separator between
// whichever ones actually render — filtering nulls first means the
// separators land only between real content, never next to a gap left
// by a missing project/priority/etc.
function withSeparators(nodes: React.ReactNode[]): React.ReactNode[] {
  const visible = nodes.filter((n) => n !== null && n !== undefined && n !== false);
  const result: React.ReactNode[] = [];
  visible.forEach((node, i) => {
    if (i > 0) result.push(<span key={`sep-${i}`} className="h-3.5 w-px shrink-0 bg-gray-200" />);
    result.push(
      <span key={`item-${i}`} className="flex shrink-0 items-center">
        {node}
      </span>,
    );
  });
  return result;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
  subtaskProgressByTask: Map<string, { done: number; total: number }>;
  projectNameById?: Map<string, string>;
  groupOptions: { id: string; label: string }[];
  groupIdForTask: (task: FlatTaskRow) => string | undefined;
  groupColumnLabel: string;
  secondaryLabelForTask?: (task: FlatTaskRow) => string | undefined;
  onOpenTask: (taskId: string) => void;
  onOpenBoard?: (boardId: string) => void;
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
  subtaskProgressByTask,
  projectNameById,
  groupOptions,
  groupIdForTask,
  groupColumnLabel,
  secondaryLabelForTask,
  onOpenTask,
  onOpenBoard,
  currentUserId,
  emptyLabel,
}: FlatTaskListProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<StatusCategory>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [taskTypeFilter, setTaskTypeFilter] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all"); // all | mine | unassigned | <userId>
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const hasActiveFilters =
    statusFilter.size > 0 ||
    priorityFilter.size > 0 ||
    taskTypeFilter.size > 0 ||
    groupFilter.size > 0 ||
    assigneeFilter !== "all" ||
    overdueOnly;

  const clearFilters = () => {
    setStatusFilter(new Set());
    setPriorityFilter(new Set());
    setTaskTypeFilter(new Set());
    setGroupFilter(new Set());
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
      if (groupFilter.size > 0) {
        const groupId = groupIdForTask(t);
        if (!groupId || !groupFilter.has(groupId)) return false;
      }
      if (overdueOnly && !t.is_overdue) return false;
      if (assigneeFilter !== "all") {
        const assignees = assigneesByTask.get(t.id) ?? [];
        if (assigneeFilter === "unassigned" && assignees.length > 0) return false;
        if (assigneeFilter === "mine" && !(currentUserId && assignees.includes(currentUserId))) return false;
        if (assigneeFilter !== "mine" && assigneeFilter !== "unassigned" && !assignees.includes(assigneeFilter)) return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, taskTypeFilter, groupFilter, overdueOnly, assigneeFilter, assigneesByTask, statusesById, groupIdForTask, currentUserId]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title, "ar") * dir;
        case "priority": {
          const av = a.priority ? PRIORITY_ORDER[a.priority] : 99;
          const bv = b.priority ? PRIORITY_ORDER[b.priority] : 99;
          return (av - bv) * dir;
        }
        case "status": {
          const ac = statusesById.get(a.status_id)?.category;
          const bc = statusesById.get(b.status_id)?.category;
          const av = ac ? STATUS_CATEGORY_ORDER[ac] : 99;
          const bv = bc ? STATUS_CATEGORY_ORDER[bc] : 99;
          return (av - bv) * dir;
        }
        case "created_at":
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        case "due_date":
        default: {
          const av = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bv = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return (av - bv) * dir;
        }
      }
    });
    return list;
  }, [filtered, sortKey, sortDir, statusesById]);

  const taskTypeOptions = Array.from(taskTypes.values());

  return (
    <div className="flex h-full flex-col">
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
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="text-xs text-gray-400 hover:text-gray-600"
              title={sortDir === "asc" ? "تصاعدي" : "تنازلي"}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>

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

            {groupOptions.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400">{groupColumnLabel}:</span>
                {groupOptions.map((g) => (
                  <FilterChip key={g.id} active={groupFilter.has(g.id)} onClick={() => setGroupFilter((s) => toggleInSet(s, g.id))}>
                    {g.label}
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
          {sorted.length} من {tasks.length} مهمة
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">{tasks.length === 0 ? emptyLabel : "لا توجد نتائج مطابقة للفلاتر"}</div>
        ) : (
          sorted.map((task) => {
            const status = statusesById.get(task.status_id);
            const taskType = taskTypes.get(task.task_type_id);
            const assignees = assigneesByTask.get(task.id) ?? [];
            const due = formatDate(task.due_date);
            const remaining = task.due_date ? daysRemainingLabel(task.due_date) : null;
            const progress = subtaskProgressByTask.get(task.id);
            const groupLabel = groupOptions.find((g) => g.id === groupIdForTask(task))?.label;
            const secondary = secondaryLabelForTask?.(task);
            const projectName = task.project_id ? projectNameById?.get(task.project_id) : undefined;

            return (
              <div
                key={task.id}
                className="flex w-full items-center gap-2.5 border-b border-gray-50 px-6 py-2.5 text-right text-sm hover:bg-gray-50"
              >
                <button onClick={() => onOpenTask(task.id)} className="flex flex-1 items-center gap-2 overflow-hidden text-right">
                  {taskType && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: taskType.color ?? "#9CA3AF" }}
                      title={taskType.name_ar}
                    />
                  )}
                  <span className="flex-1 truncate text-gray-700">{task.title}</span>
                  {progress && progress.total > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        progress.done === progress.total ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {progress.done}/{progress.total}
                    </span>
                  )}
                </button>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {withSeparators([
                    projectName && <span className="text-xs text-gray-400">{projectName}</span>,
                    (groupLabel || secondary) && (
                      <span className="text-xs text-gray-400">
                        {groupLabel}
                        {secondary ? ` · ${secondary}` : ""}
                      </span>
                    ),
                    task.priority && <Badge label={PRIORITY_LABELS[task.priority]} variant={PRIORITY_VARIANTS[task.priority]} size="sm" />,
                    <span
                      style={pillStyle(status?.color ?? null)}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                    >
                      {status?.label_ar ?? "—"}
                    </span>,
                    due && (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <span className={`text-xs ${task.is_overdue ? "font-medium text-red-500" : "text-gray-500"}`}>{due}</span>
                        {remaining && (
                          <span
                            className={`text-[10px] ${
                              remaining.tone === "overdue"
                                ? "font-medium text-red-500"
                                : remaining.tone === "today"
                                  ? "font-medium text-amber-500"
                                  : "text-gray-400"
                            }`}
                          >
                            ({remaining.text})
                          </span>
                        )}
                      </span>
                    ),
                  ])}
                </div>

                <div className="flex shrink-0 items-center -space-x-1.5 rtl:space-x-reverse">
                  {assignees.length === 0 ? (
                    <span className="text-xs text-gray-300">غير معين</span>
                  ) : (
                    assignees.slice(0, 3).map((id) => {
                      const employee = employeesById.get(id);
                      const name = employee ? `${employee.first_name} ${employee.last_name ?? ""}` : "";
                      return (
                        <Tooltip key={id} label={name || null}>
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white"
                            style={{ background: colorFor(id) }}
                          >
                            {initialsOf(name || "?")}
                          </span>
                        </Tooltip>
                      );
                    })
                  )}
                </div>

                {onOpenBoard && (
                  <button
                    onClick={() => onOpenBoard(task.board_id)}
                    className="shrink-0 rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                    title="فتح اللوحة"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
