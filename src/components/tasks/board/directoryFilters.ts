import type { Priority, TaskRow } from "../../../hooks/tasks/useTaskBoard";
import type { TaskDirectoryData } from "../../../hooks/tasks/useTaskDirectory";
import { isCompletedToday } from "./taskDates";

// Pure filter/sort logic shared by AssigneeViewPage.tsx, TaskTypeViewPage.tsx,
// and DirectoryFilterSortPopover.tsx — no JSX here so it's trivially unit-
// testable and so the popover and the two pages can't drift on what a given
// filter actually means.

export const PROJECT_NONE_KEY = "__no_project__";
export const ASSIGNEE_NONE_KEY = "__unassigned__";

export interface DirectoryFilterState {
  /** "open" = not_started/active categories (today's old includeClosed
   * default). "done" = the done category only — NOT `closed`, since the
   * trigger that stamps tasks.completed_at only fires for `done`, so a
   * combined mode would list cancelled tasks with no completion time.
   * "done_today" = done AND completed_at falls in today (device-local).
   * "all" = no status filtering. "custom" = exactly customStatusIds. */
  statusMode: "open" | "done" | "done_today" | "all" | "custom";
  customStatusIds: Set<string>;
  /** Empty = every priority, including unset. */
  priorities: Set<Priority | "none">;
  overdueOnly: boolean;
  /** Empty = every project. PROJECT_NONE_KEY = tasks with no project. */
  projectIds: Set<string>;
  /** Empty = every assignee. ASSIGNEE_NONE_KEY = unassigned tasks. */
  assigneeIds: Set<string>;
  /** Empty = every type. */
  taskTypeIds: Set<string>;
  /** Empty = every tag (and untagged tasks). */
  tagIds: Set<string>;
  hasAttachments: boolean;
  hasComments: boolean;
  hasDescription: boolean;
  isBlocked: boolean;
  hasUnmetRequirement: boolean;
}

export function createDefaultFilters(): DirectoryFilterState {
  return {
    statusMode: "open",
    customStatusIds: new Set(),
    priorities: new Set(),
    overdueOnly: false,
    projectIds: new Set(),
    assigneeIds: new Set(),
    taskTypeIds: new Set(),
    tagIds: new Set(),
    hasAttachments: false,
    hasComments: false,
    hasDescription: false,
    isBlocked: false,
    hasUnmetRequirement: false,
  };
}

export function countActiveFilters(filters: DirectoryFilterState): number {
  let n = 0;
  if (filters.statusMode !== "open") n++;
  if (filters.priorities.size > 0) n++;
  if (filters.overdueOnly) n++;
  if (filters.projectIds.size > 0) n++;
  if (filters.assigneeIds.size > 0) n++;
  if (filters.taskTypeIds.size > 0) n++;
  if (filters.tagIds.size > 0) n++;
  if (filters.hasAttachments) n++;
  if (filters.hasComments) n++;
  if (filters.hasDescription) n++;
  if (filters.isBlocked) n++;
  if (filters.hasUnmetRequirement) n++;
  return n;
}

function hasDescriptionText(task: TaskRow): boolean {
  return !!(task.description as { text?: string } | null)?.text?.trim();
}

export function filterDirectoryTasks(tasks: TaskRow[], filters: DirectoryFilterState, data: TaskDirectoryData): TaskRow[] {
  const openStatusIds = new Set(
    data.statuses.filter((s) => s.category === "not_started" || s.category === "active").map((s) => s.id),
  );
  const doneStatusIds = new Set(data.statuses.filter((s) => s.category === "done").map((s) => s.id));

  return tasks.filter((task) => {
    if (filters.statusMode === "open" && !openStatusIds.has(task.status_id)) return false;
    if (filters.statusMode === "done" && !doneStatusIds.has(task.status_id)) return false;
    if (filters.statusMode === "done_today") {
      // Both checks on purpose. completed_at alone would be enough while
      // the trigger behaves, but checking the category too means a stale
      // timestamp that somehow survived a reopen can't put an open task
      // in a "completed" list.
      if (!doneStatusIds.has(task.status_id)) return false;
      if (!isCompletedToday(task.completed_at)) return false;
    }
    if (filters.statusMode === "custom" && filters.customStatusIds.size > 0 && !filters.customStatusIds.has(task.status_id)) {
      return false;
    }

    if (filters.priorities.size > 0 && !filters.priorities.has(task.priority ?? "none")) return false;

    if (filters.overdueOnly && !task.is_overdue) return false;

    if (filters.projectIds.size > 0 && !filters.projectIds.has(task.project_id ?? PROJECT_NONE_KEY)) return false;

    if (filters.assigneeIds.size > 0) {
      const assignees = data.assigneesByTask.get(task.id) ?? [];
      const matches =
        assignees.length === 0
          ? filters.assigneeIds.has(ASSIGNEE_NONE_KEY)
          : assignees.some((id) => filters.assigneeIds.has(id));
      if (!matches) return false;
    }

    if (filters.taskTypeIds.size > 0 && !filters.taskTypeIds.has(task.task_type_id)) return false;

    if (filters.tagIds.size > 0) {
      const tags = data.tagsByTask.get(task.id) ?? [];
      if (!tags.some((t) => filters.tagIds.has(t.id))) return false;
    }

    if (filters.hasAttachments && !data.attachedTaskIds.has(task.id)) return false;
    if (filters.hasComments && !data.commentedTaskIds.has(task.id)) return false;
    if (filters.hasDescription && !hasDescriptionText(task)) return false;
    if (filters.isBlocked && !data.blockedTaskIds.has(task.id)) return false;
    if (filters.hasUnmetRequirement && !data.unmetRequirementTaskIds.has(task.id)) return false;

    return true;
  });
}

export type TaskSortKey = "due_date" | "completed_at" | "priority" | "title" | "status";
export type GroupSortKey = "count" | "name";

export interface DirectorySortState {
  taskSort: TaskSortKey;
  groupSort: GroupSortKey;
}

export const DEFAULT_SORT: DirectorySortState = { taskSort: "due_date", groupSort: "count" };

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export function sortDirectoryTasks(tasks: TaskRow[], key: TaskSortKey, data: TaskDirectoryData): TaskRow[] {
  const sorted = [...tasks];
  switch (key) {
    case "due_date":
      sorted.sort((a, b) => {
        const at = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bt = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return at - bt;
      });
      break;
    case "completed_at":
      // Descending — most recently finished first, which is the order a
      // "what got done today" list wants. Nulls (open tasks, and
      // `closed` ones the trigger never stamped) sort last either way,
      // hence -Infinity rather than the due_date case's +Infinity.
      sorted.sort((a, b) => {
        const at = a.completed_at ? new Date(a.completed_at).getTime() : Number.NEGATIVE_INFINITY;
        const bt = b.completed_at ? new Date(b.completed_at).getTime() : Number.NEGATIVE_INFINITY;
        return bt - at;
      });
      break;
    case "priority":
      sorted.sort((a, b) => (a.priority ? PRIORITY_RANK[a.priority] : 4) - (b.priority ? PRIORITY_RANK[b.priority] : 4));
      break;
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "ar"));
      break;
    case "status": {
      const sortOrderByStatus = new Map(data.statuses.map((s) => [s.id, s.sort_order]));
      sorted.sort((a, b) => (sortOrderByStatus.get(a.status_id) ?? 0) - (sortOrderByStatus.get(b.status_id) ?? 0));
      break;
    }
  }
  return sorted;
}

/** Generic over both AssigneeGroup and TaskTypeGroup — both carry a
 * stable `key`, a display `label`, and their bucketed `tasks`. Whichever
 * group's `key` matches `fallbackKey` (the "غير معين" bucket) always
 * sorts last, regardless of sort mode. */
export function sortDirectoryGroups<G extends { key: string; label: string; tasks: TaskRow[] }>(
  groups: G[],
  sortKey: GroupSortKey,
  fallbackKey?: string,
): G[] {
  const sorted = [...groups];
  sorted.sort((a, b) => {
    if (fallbackKey) {
      if (a.key === fallbackKey && b.key !== fallbackKey) return 1;
      if (b.key === fallbackKey && a.key !== fallbackKey) return -1;
    }
    return sortKey === "count" ? b.tasks.length - a.tasks.length : a.label.localeCompare(b.label, "ar");
  });
  return sorted;
}
