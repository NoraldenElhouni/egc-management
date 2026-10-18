import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessSignature, useMyTaskAccess } from "./useTaskAccess";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
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
//
// Edits are offered the same way (2026-10-14_template_edit_sync.sql): a
// template task that changed after boards took their copies is listed on
// the template's banner; "مراجعة" opens TemplateChangesModal, which sends the
// chosen changes to the chosen boards (tasks.sync_template_changes) — only
// to fields the board's team hasn't changed — or dismisses them.

export interface TemplateSyncStatus {
  isTemplate: boolean;
  /** Real board: the templates its tasks came from. */
  templateBoards: { id: string; name: string }[];
  /** Template board: the real boards that have copies of its tasks. */
  usingBoardIds: string[];
  pendingTaskIds: string[];
  /** Template board: tasks edited since the boards took their copies. */
  changedTaskIds: string[];
  /** Template board: archived / deleted template tasks still live on a board. */
  removedCount: number;
}

interface RawStatus {
  is_template: boolean;
  template_board_ids: string[];
  using_board_ids: string[];
  pending_task_ids: string[];
  // absent until 2026-10-14_template_edit_sync.sql is applied
  changed_task_ids?: string[];
  removed_count?: number;
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
        changedTaskIds: raw.changed_task_ids ?? [],
        removedCount: raw.removed_count ?? 0,
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
  const { access } = useMyTaskAccess();

  const query = useQuery({
    queryKey: ["board-picker-options", user?.id, accessSignature(access)],
    enabled: enabled && !!user?.id && !!access,
    queryFn: async (): Promise<PickerBoard[]> => {
      if (!user?.id || !access) throw new Error("no authenticated user");
      const tasksDb = supabase.schema("tasks");

      const { data: spaces, error: spacesError } = await tasksDb
        .from("spaces")
        .select("id, name")
        .eq("is_archived", false)
        .eq("is_template", false);
      if (spacesError) throw spacesError;

      // pushing tasks into a board needs edit rights on that board's space
      const visibleSpaces = (spaces ?? []).filter((s) => access.spaces[s.id]?.caps.edit);
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

  const push = useMutation({
    mutationFn: async (input: {
      /** Real board's own id when the tasks start there; the template's id otherwise. */
      fromBoardId: string;
      templateBoardId: string;
      /** Tasks on fromBoardId. */
      taskIds: string[];
      targetBoardIds: string[];
      defaultAnchor: string;
      /** Picks for project roles nobody holds, per target board:
       * {boardId: {roleId: [userIds]}} — see RoleGapsSection.tsx. */
      roleOverrides?: Record<string, Record<string, string[]>>;
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
            roleOverrides: input.roleOverrides ?? {},
          })
        : [];

      // New assignees are told by the database (task.assigned, grouped).
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

// ---------------------------------------------------------------------
// Edits to template tasks -> the boards that used the template
// ---------------------------------------------------------------------
/** The tracked fields (snapshot keys of tasks_private.template_snapshot). */
export const TEMPLATE_FIELD_LABELS: Record<string, string> = {
  title: "العنوان",
  description: "الوصف",
  priority: "الأولوية",
  task_type_id: "النوع",
  department_id: "القسم",
  specialization_id: "التخصص",
  time_estimate_minutes: "الوقت المقدّر",
  duration_days: "المدة",
  start_lag_days: "الانتظار قبل البدء",
  parent: "المهمة الرئيسية",
  sort_order: "الترتيب",
  tag_ids: "الوسوم",
  checklists: "قوائم التحقق",
  requirements: "المتطلبات",
  values: "الحقول المخصصة",
  assignee_ids: "المكلّفون",
  role_ids: "الأدوار",
  status: "الحالة",
  waits_for: "الارتباطات",
};

export interface TemplateChangeField {
  key: string;
  old: unknown;
  new: unknown;
}

export interface TemplateChangeBoard {
  board_id: string;
  board_name: string;
  copy_id: string;
  /** Fields that would be written. */
  apply: string[];
  /** Fields the board's team changed themselves, kept as they are. */
  skip: string[];
}

export interface TemplateChangedTask {
  task_id: string;
  title: string;
  fields: TemplateChangeField[];
  boards: TemplateChangeBoard[];
}

export interface TemplateRemovedCopy {
  tombstone_id: string | null;
  template_task_id: string | null;
  title: string;
  copy_id: string;
  board_id: string;
  board_name: string;
}

export interface TemplateChanges {
  tasks: TemplateChangedTask[];
  removed: TemplateRemovedCopy[];
}

export interface TemplateSyncReport {
  updated: number;
  fields: number;
  removed: number;
  skipped: { task_id: string | null; copy_id: string; board_id: string; board_name?: string; field: string; reason: string }[];
}

export function useTemplateChanges(templateBoardId: string | undefined, enabled: boolean) {
  const query = useQuery({
    queryKey: ["template-changes", templateBoardId],
    enabled: enabled && !!templateBoardId,
    queryFn: async (): Promise<TemplateChanges> => {
      const { data, error } = await supabase
        .schema("tasks")
        .rpc("template_changes", { p_template_board_id: templateBoardId as string });
      if (error) throw error;
      return data as unknown as TemplateChanges;
    },
  });
  return { changes: query.data, loading: query.isPending && enabled };
}

export function useTemplateChangeActions() {
  const queryClient = useQueryClient();

  const refresh = (templateBoardId: string, boardIds: string[]) => {
    queryClient.invalidateQueries({ queryKey: ["template-changes", templateBoardId] });
    queryClient.invalidateQueries({ queryKey: ["template-sync", templateBoardId] });
    for (const id of boardIds) {
      queryClient.invalidateQueries({ queryKey: ["task-board", id] });
      queryClient.invalidateQueries({ queryKey: ["board-schedule", id] });
      queryClient.invalidateQueries({ queryKey: ["template-sync", id] });
    }
    queryClient.invalidateQueries({ queryKey: ["task-detail"] });
    queryClient.invalidateQueries({ queryKey: ["task-directory"] });
  };

  const sync = useMutation({
    mutationFn: async (input: {
      templateBoardId: string;
      taskIds: string[];
      targetBoardIds: string[];
      removedIds: string[];
      /** {boardId: {roleId: [userIds]}} — picks for roles nobody holds. */
      roleOverrides?: Record<string, Record<string, string[]>>;
    }): Promise<TemplateSyncReport> => {
      const { data, error } = await supabase.schema("tasks").rpc("sync_template_changes", {
        p_template_board_id: input.templateBoardId,
        p_task_ids: input.taskIds,
        p_target_board_ids: input.targetBoardIds,
        p_removed_ids: input.removedIds,
        p_role_overrides: input.roleOverrides ?? {},
      });
      if (error) throw error;
      return data as unknown as TemplateSyncReport;
    },
    onSuccess: (_report, input) => refresh(input.templateBoardId, input.targetBoardIds),
  });

  const dismiss = useMutation({
    mutationFn: async (input: { templateBoardId: string; taskIds: string[]; removedIds: string[] }) => {
      const { error } = await supabase.schema("tasks").rpc("dismiss_template_changes", {
        p_template_board_id: input.templateBoardId,
        p_task_ids: input.taskIds,
        p_removed_ids: input.removedIds,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => refresh(input.templateBoardId, []),
  });

  return {
    sync: sync.mutateAsync,
    syncing: sync.isPending,
    dismiss: dismiss.mutateAsync,
    dismissing: dismiss.isPending,
  };
}
