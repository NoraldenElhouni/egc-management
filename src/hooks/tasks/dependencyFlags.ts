import { supabase } from "../../lib/supabaseClient";
import type { DependencyPair } from "./useTaskBoard";

// Both ends of every dependency a list of tasks takes part in, reduced to
// what a row shows: the stop icon on a task that waits, the "!" on a task
// others wait on. Shared by the board (useTaskBoard.ts) and the directory
// views (useTaskDirectory.ts) so both read a link the same way.
//
// A link is active while the task being waited on isn't done/closed and
// neither end is archived (the scheduler treats archived tasks as gone).

export interface DependencyFlags {
  /** Titles of the open tasks this one waits on — the stop icon. */
  waitingOn: string[];
  /** Titles of the tasks waiting on this one while it's still open — the "!" icon. */
  holding: string[];
  /** Waited on something, and everything it waited on is now done/closed. */
  cleared: boolean;
}

export interface DependencyTaskInfo {
  id: string;
  title: string;
  status_id: string;
  is_archived: boolean;
}

export interface DependencyFlagsResult {
  /** Links whose waiting end is in the list — what the Gantt draws. */
  dependencies: DependencyPair[];
  /** Tasks in the list with at least one active link they wait on. */
  blockedTaskIds: Set<string>;
  dependencyFlags: Map<string, DependencyFlags>;
}

const isFinished = (category: string | undefined) => category === "done" || category === "closed";

/**
 * @param taskIds the tasks being shown
 * @param known tasks already loaded (at least the shown ones), so only the
 *   other ends on other boards / archived are fetched
 * @param categoryByStatusId status categories already loaded
 */
export async function loadDependencyFlags(
  taskIds: string[],
  known: DependencyTaskInfo[],
  categoryByStatusId: Map<string, string>,
): Promise<DependencyFlagsResult> {
  const tasksDb = supabase.schema("tasks");
  const empty: DependencyFlagsResult = { dependencies: [], blockedTaskIds: new Set(), dependencyFlags: new Map() };
  if (!taskIds.length) return empty;

  const [waitingResult, holdingResult] = await Promise.all([
    tasksDb.from("task_dependencies").select("blocked_task_id, blocking_task_id").in("blocked_task_id", taskIds),
    tasksDb.from("task_dependencies").select("blocked_task_id, blocking_task_id").in("blocking_task_id", taskIds),
  ]);
  if (waitingResult.error) throw waitingResult.error;
  if (holdingResult.error) throw holdingResult.error;

  const dependencies = waitingResult.data ?? [];
  const shown = new Set(taskIds);
  // a link between two shown tasks comes back from both queries
  const edges = [
    ...dependencies,
    ...(holdingResult.data ?? []).filter((d) => !shown.has(d.blocked_task_id)),
  ];
  if (!edges.length) return { ...empty, dependencies };

  const taskById = new Map(known.map((t) => [t.id, t]));
  const missingIds = Array.from(
    new Set(edges.flatMap((d) => [d.blocking_task_id, d.blocked_task_id]).filter((id) => !taskById.has(id))),
  );
  if (missingIds.length) {
    const { data, error } = await tasksDb.from("tasks").select("id, title, status_id, is_archived").in("id", missingIds);
    if (error) throw error;
    for (const t of data ?? []) taskById.set(t.id, t);
  }

  // other boards can use other status sets
  const categories = new Map(categoryByStatusId);
  const missingStatusIds = Array.from(
    new Set(Array.from(taskById.values(), (t) => t.status_id).filter((id) => !categories.has(id))),
  );
  if (missingStatusIds.length) {
    const { data, error } = await tasksDb.from("statuses").select("id, category").in("id", missingStatusIds);
    if (error) throw error;
    for (const s of data ?? []) categories.set(s.id, s.category);
  }

  const dependencyFlags = new Map<string, DependencyFlags>();
  const flagsOf = (id: string) => {
    let flags = dependencyFlags.get(id);
    if (!flags) {
      flags = { waitingOn: [], holding: [], cleared: false };
      dependencyFlags.set(id, flags);
    }
    return flags;
  };

  const waitedOnSomething = new Set<string>();
  for (const d of edges) {
    const blocking = taskById.get(d.blocking_task_id);
    const blocked = taskById.get(d.blocked_task_id);
    if (!blocking || !blocked || blocking.is_archived || blocked.is_archived) continue;
    if (shown.has(blocked.id)) waitedOnSomething.add(blocked.id);
    if (isFinished(categories.get(blocking.status_id))) continue;
    if (shown.has(blocked.id)) flagsOf(blocked.id).waitingOn.push(blocking.title);
    if (shown.has(blocking.id)) flagsOf(blocking.id).holding.push(blocked.title);
  }

  const blockedTaskIds = new Set<string>();
  for (const id of waitedOnSomething) {
    if (dependencyFlags.get(id)?.waitingOn.length) blockedTaskIds.add(id);
    else flagsOf(id).cleared = true;
  }

  return { dependencies, blockedTaskIds, dependencyFlags };
}
