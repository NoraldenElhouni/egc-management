import { supabase } from "../../lib/supabaseClient";
import { notifyUsers } from "../notifications/pushNotifications";

// After a template is applied or pushed, the copied tasks arrive with
// their assignees already set server-side (named people, plus everyone a
// project role resolved to — see tasks._assign_roles). Nothing client-side
// saw those assignments happen, so this pushes "you've been assigned" for
// them: one notification per person, never to whoever did the copying.
// Best-effort, same posture as setAssignees' own push in useTaskBoard.ts.
export async function notifyNewAssignees(newTaskIds: string[], actorUserId: string | undefined): Promise<void> {
  if (newTaskIds.length === 0) return;
  const tasksDb = supabase.schema("tasks");

  const [{ data: assigneeRows, error: assigneeError }, { data: taskRows, error: taskError }] = await Promise.all([
    tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", newTaskIds),
    tasksDb.from("tasks").select("id, title").in("id", newTaskIds),
  ]);
  if (assigneeError || taskError) {
    console.error("notifyNewAssignees:", (assigneeError ?? taskError)?.message);
    return;
  }

  const titleById = new Map((taskRows ?? []).map((t) => [t.id, t.title]));
  const tasksByUser = new Map<string, string[]>();
  for (const row of assigneeRows ?? []) {
    if (row.user_id === actorUserId) continue;
    const list = tasksByUser.get(row.user_id) ?? [];
    list.push(row.task_id);
    tasksByUser.set(row.user_id, list);
  }

  for (const [userId, taskIds] of tasksByUser) {
    const body = taskIds.length === 1 ? (titleById.get(taskIds[0]) ?? "مهمة") : `${taskIds.length} مهام جديدة`;
    void notifyUsers([userId], "تم تكليفك بمهمة جديدة", body, {
      url: taskIds.length === 1 ? `/tasks/${taskIds[0]}` : "/tasks/my-work",
    });
  }
}
