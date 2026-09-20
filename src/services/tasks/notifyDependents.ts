import { supabase } from "../../lib/supabaseClient";
import { notifyUsers } from "../notifications/pushNotifications";

// =====================================================================
// Called after a task is confirmed to have moved into a done-category
// status. tasks.task_dependencies is otherwise purely advisory (the
// "محظورة" lock badge, nothing else) — nothing else in the schema reacts
// to a dependency clearing. This is the small, contained piece: check
// whether finishing this task unblocks another one, and if so, push
// THAT task's existing assignees — not this task's creator, not the
// person who just finished it.
//
// No persisted notification record exists anywhere (push-and-forget
// only, see pushNotifications.ts) — a task that moves out of and back
// into a done-category status re-triggers this check and can re-notify.
// Known, accepted limitation, not solved here.
// =====================================================================

const tasksDb = supabase.schema("tasks");

export async function notifyDependentAssignees(taskId: string): Promise<void> {
  const { data: depRows, error: depError } = await tasksDb
    .from("task_dependencies")
    .select("blocked_task_id")
    .eq("blocking_task_id", taskId);
  if (depError) {
    console.error("notifyDependentAssignees: failed to fetch dependents:", depError.message);
    return;
  }

  const candidateIds = Array.from(new Set((depRows ?? []).map((r) => r.blocked_task_id)));
  if (candidateIds.length === 0) return;

  for (const candidateId of candidateIds) {
    const { data: blockerRows, error: blockerError } = await tasksDb
      .from("task_dependencies")
      .select("blocking_task_id")
      .eq("blocked_task_id", candidateId);
    if (blockerError) {
      console.error("notifyDependentAssignees: failed to fetch blockers:", blockerError.message);
      continue;
    }

    const blockerIds = (blockerRows ?? []).map((r) => r.blocking_task_id);
    const { data: blockerTasks, error: blockerTasksError } = await tasksDb
      .from("tasks")
      .select("status_id")
      .in("id", blockerIds);
    if (blockerTasksError) {
      console.error("notifyDependentAssignees: failed to fetch blocker tasks:", blockerTasksError.message);
      continue;
    }

    const statusIds = Array.from(new Set((blockerTasks ?? []).map((t) => t.status_id)));
    const { data: statusRows, error: statusError } = await tasksDb
      .from("statuses")
      .select("id, category")
      .in("id", statusIds.length > 0 ? statusIds : ["__none__"]);
    if (statusError) {
      console.error("notifyDependentAssignees: failed to fetch statuses:", statusError.message);
      continue;
    }

    const categoryByStatus = new Map((statusRows ?? []).map((s) => [s.id, s.category]));
    const allBlockersDone = (blockerTasks ?? []).every((t) => categoryByStatus.get(t.status_id) === "done");
    if (!allBlockersDone) continue;

    const [{ data: assigneeRows, error: assigneeError }, { data: candidateTask, error: candidateError }] =
      await Promise.all([
        tasksDb.from("task_assignees").select("user_id").eq("task_id", candidateId),
        tasksDb.from("tasks").select("title").eq("id", candidateId).single(),
      ]);
    if (assigneeError) {
      console.error("notifyDependentAssignees: failed to fetch assignees:", assigneeError.message);
      continue;
    }
    if (candidateError) {
      console.error("notifyDependentAssignees: failed to fetch candidate task:", candidateError.message);
      continue;
    }

    const recipients = (assigneeRows ?? []).map((r) => r.user_id);
    if (recipients.length === 0) continue;

    await notifyUsers(recipients, "المهمة التالية جاهزة الآن", candidateTask.title, {
      url: `/tasks/${candidateId}`,
    });
  }
}
