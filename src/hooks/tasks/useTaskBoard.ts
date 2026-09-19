import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database, Json } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import { resolveStatusSetId } from "./resolveStatusSetId";
import { DEFAULT_FEATURE_SETTINGS, type SpaceFeatureSettings } from "./useSpaceSettings";
import { notifyUsers } from "../../services/notifications/pushNotifications";

// D2 — Zone board (list view), the main screen (build plan Part 7, D2).
//
// Custom columns (board_columns → field_definitions → task_values) are
// attach-existing-or-create-new, per §4.11's "define once, attach many" —
// detaching a column (deleting its board_columns row) never touches
// task_values, so it's non-destructive and the field can be reattached
// later with its data intact. There's no "hidden columns" browser here
// (is_visible exists on board_columns but this screen doesn't use it) —
// "···" only offers rename-the-field (shared everywhere it's attached)
// and detach-from-this-board, not hide/unhide.

export type TaskRow = Database["tasks"]["Tables"]["tasks"]["Row"];
export type StatusRow = Database["tasks"]["Tables"]["statuses"]["Row"];
export type Priority = Database["tasks"]["Enums"]["priority"];
export type FieldType = Database["tasks"]["Enums"]["field_type"];

export interface CustomColumn {
  boardColumnId: string;
  fieldDefinitionId: string;
  name_ar: string;
  type: FieldType;
  config: Json;
}

export interface EmployeeLite {
  id: string;
  first_name: string;
  last_name: string | null;
}

export interface TaskTypeLite {
  id: string;
  name_ar: string;
  color: string | null;
}

export interface TagLite {
  id: string;
  name: string;
  color: string | null;
}

export interface TaskBoardData {
  board: { id: string; name: string; space_id: string; zone_id: string | null };
  zoneName: string | null;
  statuses: StatusRow[];
  tasks: TaskRow[];
  assigneesByTask: Map<string, string[]>; // task_id -> user_id[]
  employees: EmployeeLite[];
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  attachedTaskIds: Set<string>;
  commentedTaskIds: Set<string>;
  tagsByTask: Map<string, TagLite[]>;
  subtaskProgressByTask: Map<string, { done: number; total: number }>;
  /** null when the board's space isn't a project space (department/company/personal) — tasks.project_id is nullable for exactly this case. */
  projectId: string | null;
  customColumns: CustomColumn[];
  hiddenColumns: CustomColumn[];
  valuesByTask: Map<string, Map<string, Json>>; // task_id -> field_definition_id -> value
  featureSettings: SpaceFeatureSettings;
}

export function useAllFieldDefinitions() {
  const query = useQuery({
    queryKey: ["all-field-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase.schema("tasks").from("field_definitions").select("id, name_ar, type, config").order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });
  return query.data ?? [];
}

export function useTaskBoard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["task-board", boardId];

  const query = useQuery({
    queryKey,
    enabled: !!boardId,
    queryFn: async (): Promise<TaskBoardData> => {
      if (!boardId) throw new Error("no board id");

      const { data: board, error: boardError } = await tasksDb
        .from("boards")
        .select("id, name, space_id, zone_id, status_set_id")
        .eq("id", boardId)
        .single();
      if (boardError) throw boardError;

      const [{ data: space, error: spaceError }, statusSetId, zoneRow] =
        await Promise.all([
          tasksDb
            .from("spaces")
            .select("project_id, settings")
            .eq("id", board.space_id)
            .single(),
          resolveStatusSetId(board.status_set_id, board.space_id),
          board.zone_id
            ? supabase.schema("boq").from("zones").select("name").eq("id", board.zone_id).single()
            : Promise.resolve({ data: null, error: null }),
        ]);
      if (spaceError) throw spaceError;
      if (zoneRow.error) throw zoneRow.error;

      // D9's "الميزات" tab wrote these but nothing ever read them back —
      // priorities/task_types were saved, fully inert. This is the read
      // side: D2 respects them for the priority column and the task-type
      // dot/group-by option. time_tracking stays inert (no time-tracking
      // UI exists yet to gate); default_view stays inert (Kanban is
      // Part 7/Phase 7 "Later", not built).
      const featureSettings: SpaceFeatureSettings = {
        ...DEFAULT_FEATURE_SETTINGS,
        ...(space.settings as unknown as Partial<SpaceFeatureSettings>),
      };

      const [
        { data: statuses, error: statusesError },
        { data: tasks, error: tasksError },
      ] = await Promise.all([
        tasksDb
          .from("statuses")
          .select("*")
          .eq("status_set_id", statusSetId)
          .order("sort_order", { ascending: true }),
        tasksDb
          .from("tasks")
          .select("*")
          .eq("board_id", boardId)
          .eq("is_archived", false)
          .order("sort_order", { ascending: true }),
      ]);
      if (statusesError) throw statusesError;
      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const departmentIds = Array.from(
        new Set((tasks ?? []).map((t) => t.department_id).filter(Boolean)),
      ) as string[];

      const [
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: taskTypeRows, error: taskTypesError },
        { data: departmentRows, error: departmentsError },
        linksResult,
        dependenciesResult,
        requirementsResult,
        attachmentsResult,
        commentsResult,
        taskTagsResult,
      ] = await Promise.all([
        taskIds.length
          ? tasksDb
              .from("task_assignees")
              .select("task_id, user_id")
              .in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name"),
        // The full company-wide catalog, not just the types already used on
        // this board's tasks — TaskTypeCell's popover needs every type as a
        // pickable option, same reasoning as useAllFieldDefinitions.
        tasksDb.from("task_types").select("id, name_ar, color").order("name_ar"),
        departmentIds.length
          ? supabase.from("departments").select("id, name_ar, name").in("id", departmentIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_links").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb
              .from("task_dependencies")
              .select("blocked_task_id, blocking_task_id")
              .in("blocked_task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb
              .from("task_requirements")
              .select("task_id")
              .in("task_id", taskIds)
              .eq("is_satisfied", false)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? supabase.from("attachments").select("entity_id").eq("entity_type", "task").in("entity_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_comments").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_tags").select("task_id, tag_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (taskTypesError) throw taskTypesError;
      if (departmentsError) throw departmentsError;
      if (linksResult.error) throw linksResult.error;
      if (dependenciesResult.error) throw dependenciesResult.error;
      if (requirementsResult.error) throw requirementsResult.error;
      if (attachmentsResult.error) throw attachmentsResult.error;
      if (commentsResult.error) throw commentsResult.error;
      if (taskTagsResult.error) throw taskTagsResult.error;

      // Which tags exist isn't known until task_tags resolves, so this is
      // a follow-up query rather than part of the Promise.all above (same
      // shape as the blocking-tasks lookup further down) — only the tags
      // actually attached to this board's tasks, not the full company
      // catalog (unlike TaskTypeCell's popover, this is read-only display).
      const attachedTagIds = Array.from(new Set((taskTagsResult.data ?? []).map((r) => r.tag_id)));
      const { data: tagRows, error: tagsError } = attachedTagIds.length
        ? await tasksDb.from("tags").select("id, name, color").in("id", attachedTagIds)
        : { data: [], error: null };
      if (tagsError) throw tagsError;

      const tagById = new Map((tagRows ?? []).map((t) => [t.id, t]));
      const tagsByTask = new Map<string, TagLite[]>();
      for (const row of taskTagsResult.data ?? []) {
        const tag = tagById.get(row.tag_id);
        if (!tag) continue;
        const list = tagsByTask.get(row.task_id) ?? [];
        list.push(tag);
        tagsByTask.set(row.task_id, list);
      }

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      const taskTypes = new Map<string, TaskTypeLite>(
        (taskTypeRows ?? []).map((t) => [t.id, t]),
      );

      const departmentNamesById = new Map<string, string>(
        (departmentRows ?? []).map((d) => [d.id, d.name_ar ?? d.name]),
      );

      const linkedTaskIds = new Set((linksResult.data ?? []).map((r) => r.task_id));

      // A dependency only still "blocks" if the task blocking it hasn't
      // reached a done/closed status yet.
      const blockingIds = Array.from(
        new Set((dependenciesResult.data ?? []).map((d) => d.blocking_task_id)),
      );
      let openBlockingIds = new Set<string>();
      if (blockingIds.length) {
        const { data: blockingTasks, error: blockingError } = await tasksDb
          .from("tasks")
          .select("id, status_id")
          .in("id", blockingIds);
        if (blockingError) throw blockingError;
        const blockingStatusIds = Array.from(
          new Set((blockingTasks ?? []).map((t) => t.status_id)),
        );
        const { data: blockingStatuses, error: blockingStatusesError } =
          blockingStatusIds.length
            ? await tasksDb
                .from("statuses")
                .select("id, category")
                .in("id", blockingStatusIds)
            : { data: [], error: null };
        if (blockingStatusesError) throw blockingStatusesError;
        const categoryByStatus = new Map(
          (blockingStatuses ?? []).map((s) => [s.id, s.category]),
        );
        openBlockingIds = new Set(
          (blockingTasks ?? [])
            .filter((t) => {
              const category = categoryByStatus.get(t.status_id);
              return category !== "done" && category !== "closed";
            })
            .map((t) => t.id),
        );
      }
      const blockedTaskIds = new Set(
        (dependenciesResult.data ?? [])
          .filter((d) => openBlockingIds.has(d.blocking_task_id))
          .map((d) => d.blocked_task_id),
      );

      const unmetRequirementTaskIds = new Set(
        (requirementsResult.data ?? []).map((r) => r.task_id),
      );

      const attachedTaskIds = new Set((attachmentsResult.data ?? []).map((a) => a.entity_id));
      const commentedTaskIds = new Set((commentsResult.data ?? []).map((c) => c.task_id));

      // Subtask progress (Part 11 open decision #5) — plain completed-count,
      // not weighted by time_estimate_minutes: most ad-hoc tasks never get
      // an estimate filled in, so weighting would silently show 0% or hide
      // the badge entirely for them. Counting always works. Direct
      // children only, not the whole subtree, matching D2's row scope.
      const categoryByStatusId = new Map((statuses ?? []).map((s) => [s.id, s.category]));
      const subtaskProgressByTask = new Map<string, { done: number; total: number }>();
      for (const t of tasks ?? []) {
        if (!t.parent_task_id) continue;
        const progress = subtaskProgressByTask.get(t.parent_task_id) ?? { done: 0, total: 0 };
        progress.total += 1;
        const category = categoryByStatusId.get(t.status_id);
        if (category === "done" || category === "closed") progress.done += 1;
        subtaskProgressByTask.set(t.parent_task_id, progress);
      }

      // Fetch every column regardless of visibility — is_visible was
      // previously only ever written as true, so "hide" had no unhide
      // path (a hidden column would just vanish from every query that
      // filters on it). hiddenColumns below is what makes it reversible.
      const { data: boardColumnRows, error: boardColumnsError } = await tasksDb
        .from("board_columns")
        .select("id, field_definition_id, sort_order, is_visible")
        .eq("board_id", boardId)
        .order("sort_order");
      if (boardColumnsError) throw boardColumnsError;

      const columnFieldIds = (boardColumnRows ?? []).map((c) => c.field_definition_id);
      const [{ data: fieldDefRows, error: fieldDefsError }, { data: valueRows, error: valuesError }] = await Promise.all([
        columnFieldIds.length
          ? tasksDb.from("field_definitions").select("id, name_ar, type, config").in("id", columnFieldIds)
          : Promise.resolve({ data: [], error: null }),
        columnFieldIds.length && taskIds.length
          ? tasksDb.from("task_values").select("task_id, field_definition_id, value").in("field_definition_id", columnFieldIds).in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (fieldDefsError) throw fieldDefsError;
      if (valuesError) throw valuesError;

      const fieldDefById = new Map((fieldDefRows ?? []).map((f) => [f.id, f]));
      const allColumns = (boardColumnRows ?? [])
        .map((c) => {
          const field = fieldDefById.get(c.field_definition_id);
          return field
            ? { boardColumnId: c.id, fieldDefinitionId: field.id, name_ar: field.name_ar, type: field.type, config: field.config, isVisible: c.is_visible }
            : null;
        })
        .filter((c): c is CustomColumn & { isVisible: boolean } => !!c);

      const toCustomColumn = (c: CustomColumn & { isVisible: boolean }): CustomColumn => ({
        boardColumnId: c.boardColumnId,
        fieldDefinitionId: c.fieldDefinitionId,
        name_ar: c.name_ar,
        type: c.type,
        config: c.config,
      });
      const customColumns: CustomColumn[] = allColumns.filter((c) => c.isVisible).map(toCustomColumn);
      const hiddenColumns: CustomColumn[] = allColumns.filter((c) => !c.isVisible).map(toCustomColumn);

      const valuesByTask = new Map<string, Map<string, Json>>();
      for (const row of valueRows ?? []) {
        const forTask = valuesByTask.get(row.task_id) ?? new Map<string, Json>();
        forTask.set(row.field_definition_id, row.value);
        valuesByTask.set(row.task_id, forTask);
      }

      return {
        board: {
          id: board.id,
          name: board.name,
          space_id: board.space_id,
          zone_id: board.zone_id,
        },
        zoneName: zoneRow.data?.name ?? null,
        statuses: statuses ?? [],
        tasks: tasks ?? [],
        assigneesByTask,
        employees: employees ?? [],
        taskTypes,
        departmentNamesById,
        linkedTaskIds,
        blockedTaskIds,
        unmetRequirementTaskIds,
        attachedTaskIds,
        commentedTaskIds,
        tagsByTask,
        subtaskProgressByTask,
        projectId: space.project_id,
        customColumns,
        hiddenColumns,
        valuesByTask,
        featureSettings,
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ status_id: statusId })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTaskType = useMutation({
    mutationFn: async ({ taskId, taskTypeId }: { taskId: string; taskTypeId: string }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ task_type_id: taskTypeId })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePriority = useMutation({
    mutationFn: async ({
      taskId,
      priority,
    }: {
      taskId: string;
      priority: Priority | null;
    }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ priority })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateDueDate = useMutation({
    mutationFn: async ({
      taskId,
      dueDate,
    }: {
      taskId: string;
      dueDate: string | null;
    }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ due_date: dueDate })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStartDate = useMutation({
    mutationFn: async ({
      taskId,
      startDate,
    }: {
      taskId: string;
      startDate: string | null;
    }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ start_date: startDate })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setAssignees = useMutation({
    mutationFn: async ({
      taskId,
      userIds,
    }: {
      taskId: string;
      userIds: string[];
    }) => {
      const current = query.data?.assigneesByTask.get(taskId) ?? [];
      const toAdd = userIds.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !userIds.includes(id));

      if (toRemove.length) {
        const { error } = await tasksDb
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .in("user_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length && user?.id) {
        const { error } = await tasksDb.from("task_assignees").insert(
          toAdd.map((userId) => ({
            task_id: taskId,
            user_id: userId,
            assigned_by: user.id,
          })),
        );
        if (error) throw error;

        // Best-effort, not awaited into the mutation's own error path —
        // see the identical note in useTaskDetail.ts's setAssignees.
        const recipients = toAdd.filter((id) => id !== user.id);
        if (recipients.length > 0) {
          const taskTitle = query.data?.tasks.find((t) => t.id === taskId)?.title ?? "مهمة";
          void notifyUsers(recipients, "تم تكليفك بمهمة جديدة", taskTitle, {
            url: `/tasks/${taskId}`,
          });
        }
      }
    },
    onSuccess: invalidate,
  });

  const createTask = useMutation({
    mutationFn: async ({
      title,
      parentTaskId,
    }: {
      title: string;
      parentTaskId: string | null;
    }) => {
      if (!boardId || !query.data) throw new Error("board not loaded");
      const firstOpenStatus =
        query.data.statuses.find((s) => s.category === "not_started") ??
        query.data.statuses[0];
      if (!firstOpenStatus) throw new Error("لا توجد حالات معرّفة لهذه اللوحة");

      const maxSort = query.data.tasks
        .filter((t) => t.parent_task_id === parentTaskId)
        .reduce((max, t) => Math.max(max, t.sort_order), -1);

      const { error } = await tasksDb.from("tasks").insert({
        board_id: boardId,
        parent_task_id: parentTaskId,
        title,
        status_id: firstOpenStatus.id,
        project_id: query.data.projectId,
        created_by: user?.id ?? null,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setTaskValue = useMutation({
    mutationFn: async ({ taskId, fieldDefinitionId, value }: { taskId: string; fieldDefinitionId: string; value: Json }) => {
      const { error } = await tasksDb
        .from("task_values")
        .upsert({ task_id: taskId, field_definition_id: fieldDefinitionId, value }, { onConflict: "task_id,field_definition_id" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const attachField = useMutation({
    mutationFn: async (fieldDefinitionId: string) => {
      if (!boardId) throw new Error("no board id");
      const maxSort = (query.data?.customColumns ?? []).length;
      const { error } = await tasksDb.from("board_columns").insert({ board_id: boardId, field_definition_id: fieldDefinitionId, sort_order: maxSort });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createAndAttachField = useMutation({
    mutationFn: async (input: { name: string; name_ar: string; type: FieldType; config: Json }) => {
      if (!boardId) throw new Error("no board id");
      const { data: field, error: fieldError } = await tasksDb.from("field_definitions").insert(input).select("id").single();
      if (fieldError) throw fieldError;
      const maxSort = (query.data?.customColumns ?? []).length;
      const { error } = await tasksDb.from("board_columns").insert({ board_id: boardId, field_definition_id: field.id, sort_order: maxSort });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const detachColumn = useMutation({
    mutationFn: async (boardColumnId: string) => {
      const { error } = await tasksDb.from("board_columns").delete().eq("id", boardColumnId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setColumnVisibility = useMutation({
    mutationFn: async ({ boardColumnId, visible }: { boardColumnId: string; visible: boolean }) => {
      const { error } = await tasksDb.from("board_columns").update({ is_visible: visible }).eq("id", boardColumnId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const renameField = useMutation({
    mutationFn: async ({ fieldDefinitionId, name_ar }: { fieldDefinitionId: string; name_ar: string }) => {
      const { error } = await tasksDb.from("field_definitions").update({ name_ar }).eq("id", fieldDefinitionId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Drag-and-drop reorder/reparent — same shape as useTemplateBuilder's
  // moveTaskTo (native HTML5 DnD, no library). Cycle guard walks up from
  // the drop target before writing anything.
  const moveTaskTo = useMutation({
    mutationFn: async ({
      id,
      newParentId,
      beforeId,
    }: {
      id: string;
      newParentId: string | null;
      beforeId: string | null;
    }) => {
      if (!query.data) throw new Error("board not loaded");
      const byId = new Map(query.data.tasks.map((t) => [t.id, t]));
      let cursor: string | null = newParentId;
      while (cursor) {
        if (cursor === id) return; // would create a cycle
        cursor = byId.get(cursor)?.parent_task_id ?? null;
      }
      const moved = byId.get(id);
      if (!moved) return;
      const siblings = query.data.tasks
        .filter((t) => t.parent_task_id === newParentId && t.id !== id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const insertAt = beforeId ? siblings.findIndex((t) => t.id === beforeId) : -1;
      siblings.splice(insertAt === -1 ? siblings.length : insertAt, 0, moved);
      for (let i = 0; i < siblings.length; i++) {
        const s = siblings[i];
        const patch: Partial<TaskRow> = { sort_order: i };
        if (s.id === id) patch.parent_task_id = newParentId;
        const { error } = await tasksDb.from("tasks").update(patch).eq("id", s.id);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const employeesById = useMemo(() => {
    return new Map((query.data?.employees ?? []).map((e) => [e.id, e]));
  }, [query.data?.employees]);

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    employeesById,
    updateStatus: updateStatus.mutate,
    updateTaskType: updateTaskType.mutate,
    updatePriority: updatePriority.mutate,
    updateDueDate: updateDueDate.mutate,
    updateStartDate: updateStartDate.mutate,
    setAssignees: setAssignees.mutate,
    createTask: createTask.mutate,
    createTaskError: createTask.error as Error | null,
    setTaskValue: setTaskValue.mutate,
    attachField: attachField.mutateAsync,
    createAndAttachField: createAndAttachField.mutateAsync,
    detachColumn: detachColumn.mutateAsync,
    setColumnVisibility: setColumnVisibility.mutateAsync,
    renameField: renameField.mutateAsync,
    moveTaskTo: moveTaskTo.mutateAsync,
  };
}
