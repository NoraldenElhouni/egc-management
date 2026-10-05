import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
import { notifyUsers } from "../../services/notifications/pushNotifications";
import { callAddTasksToTemplate, callPushTemplateTasks } from "./copyTaskTree";

// =====================================================================
// Template push — keeping a template and the boards built from it in
// step after the template was applied.
// =====================================================================
// "Board B uses template T" = some task on B has source_template_task_id
// pointing at a task on T's board (set by apply_template_board, zone
// clone and push_template_tasks alike), so nothing extra is tracked.
//
// - On a template board: tasks added after it was first used and not on
//   any board yet are "pending" -> push them to the boards using it.
// - On a real board built from a template: tasks added by hand are
//   "pending" -> add them to the template, then push to the other boards.
// tasks.template_sync_status() works both out server-side.

export interface TemplateSyncStatus {
  isTemplate: boolean;
  /** Real board: the templates its tasks came from. */
  templateBoards: { id: string; name: string }[];
  /** Template board: the real boards that have copies of its tasks. */
  usingBoardIds: string[];
  pendingTaskIds: string[];
}

interface RawStatus {
  is_template: boolean;
  template_board_ids: string[];
  using_board_ids: string[];
  pending_task_ids: string[];
}

export function useTemplateSyncStatus(boardId: string | undefined) {
  const query = useQuery({
    queryKey: ["template-sync", boardId],
    enabled: !!boardId,
    queryFn: async (): Promise<TemplateSyncStatus> => {
      if (!boardId) throw new Error("no board id");
      const tasksDb = supabase.schema("tasks");

      const { data, error } = await tasksDb.rpc("template_sync_status", { p_board_id: boardId });
      if (error) throw error;
      const raw = data as unknown as RawStatus;

      const { data: templateRows, error: templatesError } = raw.template_board_ids.length
        ? await tasksDb.from("boards").select("id, name").in("id", raw.template_board_ids).order("name")
        : { data: [] as { id: string; name: string }[], error: null };
      if (templatesError) throw templatesError;

      return {
        isTemplate: raw.is_template,
        templateBoards: templateRows ?? [],
        usingBoardIds: raw.using_board_ids,
        pendingTaskIds: raw.pending_task_ids,
      };
    },
  });

  return { status: query.data, loading: query.isPending };
}

export interface PickerBoard {
  id: string;
  /** "space / board" — zone name instead of the board name when bound. */
  label: string;
}

// Every real (non-template, non-archived) board the user can see, by the
// same space-visibility rule as useTasksSidebar.ts.
export function useBoardPickerOptions(enabled: boolean) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["board-picker-options", user?.id],
    enabled: enabled && !!user?.id,
    queryFn: async (): Promise<PickerBoard[]> => {
      if (!user?.id) throw new Error("no authenticated user");
      const tasksDb = supabase.schema("tasks");

      const [{ data: spaces, error: spacesError }, { data: memberRows, error: membersError }] = await Promise.all([
        tasksDb.from("spaces").select("id, name, visibility, owner_user_id").eq("is_archived", false).eq("is_template", false),
        tasksDb.from("space_members").select("space_id").eq("user_id", user.id),
      ]);
      if (spacesError) throw spacesError;
      if (membersError) throw membersError;

      const memberSpaceIds = new Set((memberRows ?? []).map((r) => r.space_id));
      const visibleSpaces = (spaces ?? []).filter(
        (s) => s.visibility === "public" || s.owner_user_id === user.id || memberSpaceIds.has(s.id),
      );
      const spaceNameById = new Map(visibleSpaces.map((s) => [s.id, s.name]));
      if (visibleSpaces.length === 0) return [];

      const { data: boards, error: boardsError } = await tasksDb
        .from("boards")
        .select("id, name, space_id, zone_id")
        .in("space_id", visibleSpaces.map((s) => s.id))
        .eq("is_archived", false)
        .eq("is_template", false);
      if (boardsError) throw boardsError;

      const zoneIds = Array.from(new Set((boards ?? []).map((b) => b.zone_id).filter(Boolean))) as string[];
      const { data: zoneRows, error: zoneError } = zoneIds.length
        ? await supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
        : { data: [] as { id: string; name: string }[], error: null };
      if (zoneError) throw zoneError;
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      return (boards ?? [])
        .map((b) => {
          const boardName = b.zone_id ? (zoneNameById.get(b.zone_id) ?? b.name) : b.name;
          return { id: b.id, label: `${spaceNameById.get(b.space_id) ?? ""} / ${boardName}` };
        })
        .sort((a, b) => a.label.localeCompare(b.label, "ar"));
    },
  });

  return { boards: query.data ?? [], loading: query.isPending && enabled };
}

export function useTemplateSyncActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateBoards = (boardIds: string[]) => {
    for (const id of boardIds) {
      queryClient.invalidateQueries({ queryKey: ["task-board", id] });
      queryClient.invalidateQueries({ queryKey: ["template-sync", id] });
    }
    queryClient.invalidateQueries({ queryKey: ["templates-admin"] });
    queryClient.invalidateQueries({ queryKey: ["template-picker"] });
  };

  // Best-effort, like setAssignees' own push: one notification per person,
  // never to the person doing the push.
  const notifyNewAssignees = async (newTaskIds: string[]) => {
    if (newTaskIds.length === 0) return;
    const tasksDb = supabase.schema("tasks");
    const [{ data: assigneeRows }, { data: taskRows }] = await Promise.all([
      tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", newTaskIds),
      tasksDb.from("tasks").select("id, title").in("id", newTaskIds),
    ]);
    const titleById = new Map((taskRows ?? []).map((t) => [t.id, t.title]));
    const tasksByUser = new Map<string, string[]>();
    for (const row of assigneeRows ?? []) {
      if (row.user_id === user?.id) continue;
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
  };

  const push = useMutation({
    mutationFn: async (input: {
      /** Real board's own id when the tasks start there; the template's id otherwise. */
      fromBoardId: string;
      templateBoardId: string;
      /** Tasks on fromBoardId. */
      taskIds: string[];
      targetBoardIds: string[];
      defaultAnchor: string;
    }) => {
      if (!user?.id) throw new Error("no authenticated user");

      // Tasks added by hand on a real board go into the template first;
      // the originals get linked to the new template tasks, so their own
      // board is skipped by the push below.
      const templateTaskIds =
        input.fromBoardId === input.templateBoardId
          ? input.taskIds
          : await callAddTasksToTemplate({
              taskIds: input.taskIds,
              templateBoardId: input.templateBoardId,
              createdBy: user.id,
            });

      const newTaskIds = input.targetBoardIds.length
        ? await callPushTemplateTasks({
            templateBoardId: input.templateBoardId,
            taskIds: templateTaskIds,
            targetBoardIds: input.targetBoardIds,
            defaultAnchor: input.defaultAnchor,
            createdBy: user.id,
          })
        : [];

      void notifyNewAssignees(newTaskIds);
      return { ...input, created: newTaskIds.length, addedToTemplate: input.fromBoardId !== input.templateBoardId };
    },
    onSuccess: ({ fromBoardId, templateBoardId, targetBoardIds }) => {
      invalidateBoards([fromBoardId, templateBoardId, ...targetBoardIds]);
    },
  });

  const dismiss = useMutation({
    mutationFn: async ({ boardId, taskIds }: { boardId: string; taskIds: string[] }) => {
      const { error } = await supabase
        .schema("tasks")
        .from("tasks")
        .update({ template_push_dismissed: true })
        .in("id", taskIds);
      if (error) throw error;
      return boardId;
    },
    onSuccess: (boardId) => queryClient.invalidateQueries({ queryKey: ["template-sync", boardId] }),
  });

  return {
    push: push.mutateAsync,
    pushing: push.isPending,
    dismiss: dismiss.mutateAsync,
  };
}
