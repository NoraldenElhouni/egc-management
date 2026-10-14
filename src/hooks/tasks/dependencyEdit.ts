import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
import type { DependencyPair } from "./useTaskBoard";
import { recordDependencies } from "./taskUndo";
import { invalidateSchedule } from "./useTaskSchedule";

// Adding and removing dependency links — one path for the task panel
// (useTaskDetail.ts) and the board's quick ways (the "تبدأ بعد" column, the
// row's right-click menu, drag-to-link on the Gantt). Both record undo.
// A link on the same board moves dates (the scheduler runs in the
// database), so callers refresh with invalidateSchedule.

// What tasks.dependency_problem() can answer, in the user's words.
// cross_board is allowed — it just doesn't move dates.
const DEPENDENCY_PROBLEMS: Record<string, string | null> = {
  self: "لا يمكن ربط المهمة بنفسها",
  exists: "المهمتان مرتبطتان بالفعل",
  lineage: "لا يمكن ربط مهمة بمهمتها الرئيسية أو بإحدى مهامها الفرعية",
  cycle: "هذا الربط سينشئ حلقة اعتماديات دائرية",
  forbidden: "لا يمكنك ربط هاتين المهمتين",
  cross_board: null,
};

const tasksDb = () => supabase.schema("tasks");

/** blocked starts after blocking ends. */
export async function addDependency(pair: DependencyPair, actorId: string | null): Promise<void> {
  // Pre-check with the same rules the DB's trigger (prevent_dependency_cycle)
  // enforces — no loops, through the parent/subtask hierarchy too — so a bad
  // pick surfaces a clear Arabic message instead of a raw trigger error. The
  // trigger remains the real backstop either way.
  const { data: problem, error: checkError } = await tasksDb().rpc("dependency_problem", {
    p_blocking_task_id: pair.blocking_task_id,
    p_blocked_task_id: pair.blocked_task_id,
  });
  if (checkError) throw checkError;
  const message = problem ? DEPENDENCY_PROBLEMS[problem] : null;
  if (message) throw new Error(message);

  const { error } = await tasksDb()
    .from("task_dependencies")
    .insert({ ...pair, created_by: actorId });
  if (error) throw error;
  recordDependencies("ربط مهمتين", actorId, [pair], "added");
}

export async function removeDependencies(pairs: DependencyPair[], actorId: string | null): Promise<void> {
  for (const pair of pairs) {
    const { error } = await tasksDb()
      .from("task_dependencies")
      .delete()
      .eq("blocking_task_id", pair.blocking_task_id)
      .eq("blocked_task_id", pair.blocked_task_id);
    if (error) throw error;
  }
  recordDependencies(pairs.length > 1 ? "إزالة الروابط" : "إزالة ربط", actorId, pairs, "removed");
}

/** The board's link / unlink. Failures surface through the tasks error toast. */
export function useDependencyEdit(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actorId = user?.id ?? null;
  const onSettled = () => invalidateSchedule(queryClient, boardId);

  const link = useMutation({
    mutationFn: (pair: DependencyPair) => addDependency(pair, actorId),
    onSettled,
  });
  const unlink = useMutation({
    mutationFn: (pairs: DependencyPair[]) => removeDependencies(pairs, actorId),
    onSettled,
  });

  return { link: link.mutate, unlink: unlink.mutate };
}
