import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database, Json } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import { resolveStatusSetId } from "./resolveStatusSetId";
import type { EmployeeLite, StatusRow, TaskRow, CustomColumn } from "./useTaskBoard";
import type { Tag } from "./useAdminCatalog";
import { extractMentionedTaskIds } from "./mentionUtils";

// =====================================================================
// D3 — Task detail (slide-over panel), build plan Part 7.
// =====================================================================
// tasks.task_comments was added per build plan §4.17 (id, task_id,
// parent_comment_id, author_user_id, body jsonb, created_at, updated_at,
// is_resolved) — see the migration this hook now assumes exists. `body`
// stores `{ text: string }`, the same plain shape `description` already
// uses (build plan §4.7 — jsonb, not HTML, no rich-text editor yet).

export type Requirement = Database["tasks"]["Tables"]["task_requirements"]["Row"];
export type Checklist = Database["tasks"]["Tables"]["checklists"]["Row"];
export type ChecklistItem = Database["tasks"]["Tables"]["checklist_items"]["Row"];
export type Relationship = Database["tasks"]["Tables"]["task_relationships"]["Row"];
export type Activity = Database["tasks"]["Tables"]["task_activity"]["Row"];
export type Comment = Database["tasks"]["Tables"]["task_comments"]["Row"];
export type TaskLink = Database["tasks"]["Tables"]["task_links"]["Row"];
export type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

export interface DependencyTaskRef {
  id: string;
  title: string;
  statusCategory: Database["tasks"]["Enums"]["status_category"];
}

export interface Breadcrumb {
  projectName: string | null;
  zoneName: string | null;
  parentTitle: string | null;
  parentId: string | null;
  boardId: string;
}

export interface TaskDetailData {
  task: TaskRow;
  breadcrumb: Breadcrumb;
  statuses: StatusRow[];
  employees: EmployeeLite[];
  employeesById: Map<string, EmployeeLite>;
  assigneeIds: string[];
  departmentNamesById: Map<string, string>;
  allDepartments: { id: string; label: string }[];
  allSpecializations: { id: string; name: string }[];
  specializationName: string | null;
  links: TaskLink[];
  requirements: Requirement[];
  blocking: DependencyTaskRef[]; // tasks that block this one
  blockedByMe: DependencyTaskRef[]; // tasks waiting on this one
  checklists: (Checklist & { items: ChecklistItem[] })[];
  subtasks: { id: string; title: string; status: StatusRow | null }[];
  relationships: (Relationship & { relatedTitle: string })[];
  attachments: Attachment[];
  activity: Activity[];
  comments: Comment[];
  allTags: Tag[];
  tagIds: string[];
  customColumns: CustomColumn[];
  customValues: Map<string, Json>;
}

export function useTaskDetail(taskId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["task-detail", taskId];

  const query = useQuery({
    queryKey,
    enabled: !!taskId,
    queryFn: async (): Promise<TaskDetailData> => {
      if (!taskId) throw new Error("no task id");

      const { data: task, error: taskError } = await tasksDb
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();
      if (taskError) throw taskError;

      const { data: board, error: boardError } = await tasksDb
        .from("boards")
        .select("id, name, space_id, zone_id, status_set_id")
        .eq("id", task.board_id)
        .single();
      if (boardError) throw boardError;

      const [statusSetId, projectRow, zoneRow, parentRow] = await Promise.all([
        resolveStatusSetId(board.status_set_id, board.space_id),
        task.project_id
          ? supabase.from("projects").select("name").eq("id", task.project_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        task.zone_id
          ? supabase.schema("boq").from("zones").select("name").eq("id", task.zone_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        task.parent_task_id
          ? tasksDb.from("tasks").select("id, title").eq("id", task.parent_task_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (projectRow.error) throw projectRow.error;
      if (zoneRow.error) throw zoneRow.error;
      if (parentRow.error) throw parentRow.error;

      const [
        { data: statuses, error: statusesError },
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: department, error: departmentError },
        { data: specialization, error: specializationError },
        { data: allDepartmentRows, error: allDepartmentsError },
        { data: allSpecializationRows, error: allSpecializationsError },
        { data: links, error: linksError },
        { data: requirements, error: requirementsError },
        { data: blockingDeps, error: blockingError },
        { data: blockedDeps, error: blockedError },
        { data: checklists, error: checklistsError },
        { data: childTasks, error: childTasksError },
        { data: relationshipRows, error: relationshipsError },
        { data: attachments, error: attachmentsError },
        { data: activity, error: activityError },
        { data: comments, error: commentsError },
        { data: allTags, error: allTagsError },
        { data: taskTagRows, error: taskTagsError },
      ] = await Promise.all([
        tasksDb.from("statuses").select("*").eq("status_set_id", statusSetId).order("sort_order"),
        tasksDb.from("task_assignees").select("user_id").eq("task_id", taskId),
        supabase.from("employees").select("id, first_name, last_name"),
        task.department_id
          ? supabase.from("departments").select("id, name_ar, name").eq("id", task.department_id)
          : Promise.resolve({ data: [], error: null }),
        task.specialization_id
          ? supabase.from("specializations").select("name").eq("id", task.specialization_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from("departments").select("id, name_ar, name").eq("is_active", true),
        supabase.from("specializations").select("id, name"),
        tasksDb.from("task_links").select("*").eq("task_id", taskId),
        tasksDb.from("task_requirements").select("*").eq("task_id", taskId),
        tasksDb.from("task_dependencies").select("blocking_task_id").eq("blocked_task_id", taskId),
        tasksDb.from("task_dependencies").select("blocked_task_id").eq("blocking_task_id", taskId),
        tasksDb.from("checklists").select("*, checklist_items(*)").eq("task_id", taskId).order("sort_order"),
        tasksDb
          .from("tasks")
          .select("id, title, status_id")
          .eq("parent_task_id", taskId)
          .eq("is_archived", false)
          .order("sort_order"),
        tasksDb.from("task_relationships").select("*").eq("task_id", taskId),
        supabase.from("attachments").select("*").eq("entity_type", "task").eq("entity_id", taskId).order("created_at", { ascending: false }),
        tasksDb.from("task_activity").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
        tasksDb.from("task_comments").select("*").eq("task_id", taskId).order("created_at", { ascending: true }),
        tasksDb.from("tags").select("*").order("name"),
        tasksDb.from("task_tags").select("tag_id").eq("task_id", taskId),
      ]);
      if (statusesError) throw statusesError;
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (departmentError) throw departmentError;
      if (specializationError) throw specializationError;
      if (allDepartmentsError) throw allDepartmentsError;
      if (allSpecializationsError) throw allSpecializationsError;
      if (linksError) throw linksError;
      if (requirementsError) throw requirementsError;
      if (blockingError) throw blockingError;
      if (blockedError) throw blockedError;
      if (checklistsError) throw checklistsError;
      if (childTasksError) throw childTasksError;
      if (relationshipsError) throw relationshipsError;
      if (attachmentsError) throw attachmentsError;
      if (activityError) throw activityError;
      if (commentsError) throw commentsError;
      if (allTagsError) throw allTagsError;
      if (taskTagsError) throw taskTagsError;

      const referencedTaskIds = Array.from(
        new Set([
          ...(blockingDeps ?? []).map((d) => d.blocking_task_id),
          ...(blockedDeps ?? []).map((d) => d.blocked_task_id),
          ...(relationshipRows ?? []).map((r) => r.related_task_id),
        ]),
      );

      const { data: refTasks, error: refTasksError } =
        referencedTaskIds.length
          ? await tasksDb.from("tasks").select("id, title, status_id").in("id", referencedTaskIds)
          : { data: [], error: null };
      if (refTasksError) throw refTasksError;

      const refTaskById = new Map((refTasks ?? []).map((t) => [t.id, t]));
      const statusById = new Map((statuses ?? []).map((s) => [s.id, s]));

      // A referenced task's status may live in a different status set than
      // this board's — fetch any category we don't already know about.
      const unknownStatusIds = Array.from(
        new Set(
          (refTasks ?? [])
            .map((t) => t.status_id)
            .filter((id) => !statusById.has(id)),
        ),
      );
      if (unknownStatusIds.length) {
        const { data: extraStatuses, error: extraError } = await tasksDb
          .from("statuses")
          .select("*")
          .in("id", unknownStatusIds);
        if (extraError) throw extraError;
        for (const s of extraStatuses ?? []) statusById.set(s.id, s);
      }

      const toDependencyRef = (id: string): DependencyTaskRef | null => {
        const t = refTaskById.get(id);
        if (!t) return null;
        return {
          id: t.id,
          title: t.title,
          statusCategory: statusById.get(t.status_id)?.category ?? "not_started",
        };
      };

      const blocking = (blockingDeps ?? [])
        .map((d) => toDependencyRef(d.blocking_task_id))
        .filter((x): x is DependencyTaskRef => !!x);
      const blockedByMe = (blockedDeps ?? [])
        .map((d) => toDependencyRef(d.blocked_task_id))
        .filter((x): x is DependencyTaskRef => !!x);

      const subtasks = (childTasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: statusById.get(t.status_id) ?? null,
      }));

      const relationships = (relationshipRows ?? []).map((r) => ({
        ...r,
        relatedTitle: refTaskById.get(r.related_task_id)?.title ?? "مهمة محذوفة",
      }));

      // The board's attached custom fields (D2's "+"/"···" columns) had no
      // home anywhere in D3 until now — only the dense board row could
      // show or edit them. Same CustomColumn shape useTaskBoard.ts uses,
      // so CustomFieldCell renders identically in both places.
      const { data: boardColumnRows, error: boardColumnsError } = await tasksDb
        .from("board_columns")
        .select("id, field_definition_id, sort_order")
        .eq("board_id", task.board_id)
        .order("sort_order");
      if (boardColumnsError) throw boardColumnsError;

      const columnFieldIds = (boardColumnRows ?? []).map((c) => c.field_definition_id);
      const [{ data: fieldDefRows, error: fieldDefsError }, { data: valueRows, error: valuesError }] = await Promise.all([
        columnFieldIds.length
          ? tasksDb.from("field_definitions").select("id, name_ar, type, config").in("id", columnFieldIds)
          : Promise.resolve({ data: [], error: null }),
        columnFieldIds.length
          ? tasksDb.from("task_values").select("field_definition_id, value").eq("task_id", taskId).in("field_definition_id", columnFieldIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (fieldDefsError) throw fieldDefsError;
      if (valuesError) throw valuesError;

      const fieldDefById = new Map((fieldDefRows ?? []).map((f) => [f.id, f]));
      const customColumns: CustomColumn[] = (boardColumnRows ?? [])
        .map((c) => {
          const field = fieldDefById.get(c.field_definition_id);
          return field
            ? { boardColumnId: c.id, fieldDefinitionId: field.id, name_ar: field.name_ar, type: field.type, config: field.config }
            : null;
        })
        .filter((c): c is CustomColumn => !!c);

      const customValues = new Map<string, Json>((valueRows ?? []).map((v) => [v.field_definition_id, v.value]));

      return {
        task,
        breadcrumb: {
          projectName: projectRow.data?.name ?? null,
          zoneName: zoneRow.data?.name ?? null,
          parentTitle: parentRow.data?.title ?? null,
          parentId: parentRow.data?.id ?? null,
          boardId: board.id,
        },
        statuses: statuses ?? [],
        employees: employees ?? [],
        employeesById: new Map((employees ?? []).map((e) => [e.id, e])),
        assigneeIds: (assigneeRows ?? []).map((a) => a.user_id),
        departmentNamesById: new Map(
          (department ?? []).map((d) => [d.id, d.name_ar ?? d.name]),
        ),
        allDepartments: (allDepartmentRows ?? []).map((d) => ({
          id: d.id,
          label: d.name_ar ?? d.name,
        })),
        allSpecializations: allSpecializationRows ?? [],
        specializationName: specialization?.name ?? null,
        links: links ?? [],
        requirements: requirements ?? [],
        blocking,
        blockedByMe,
        checklists: (checklists ?? []).map(({ checklist_items, ...c }) => ({
          ...c,
          items: checklist_items ?? [],
        })),
        subtasks,
        relationships,
        attachments: attachments ?? [],
        activity: activity ?? [],
        comments: comments ?? [],
        allTags: allTags ?? [],
        tagIds: (taskTagRows ?? []).map((r) => r.tag_id),
        customColumns,
        customValues,
      };
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["task-board", query.data?.task.board_id] });
  };

  const updateField = useMutation({
    mutationFn: async (patch: Partial<Pick<TaskRow, "title" | "description" | "status_id" | "priority" | "due_date" | "start_date" | "department_id" | "specialization_id">>) => {
      if (!taskId) return;
      const { error } = await tasksDb.from("tasks").update(patch).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setCustomValue = useMutation({
    mutationFn: async ({ fieldDefinitionId, value }: { fieldDefinitionId: string; value: Json }) => {
      if (!taskId) return;
      const { error } = await tasksDb
        .from("task_values")
        .upsert({ task_id: taskId, field_definition_id: fieldDefinitionId, value }, { onConflict: "task_id,field_definition_id" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setAssignees = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!taskId) return;
      const current = query.data?.assigneeIds ?? [];
      const toAdd = userIds.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !userIds.includes(id));
      if (toRemove.length) {
        const { error } = await tasksDb.from("task_assignees").delete().eq("task_id", taskId).in("user_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length && user?.id) {
        const { error } = await tasksDb.from("task_assignees").insert(
          toAdd.map((userId) => ({ task_id: taskId, user_id: userId, assigned_by: user.id })),
        );
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const satisfyRequirement = useMutation({
    mutationFn: async ({ requirementId, satisfied }: { requirementId: string; satisfied: boolean }) => {
      const { error } = await tasksDb
        .from("task_requirements")
        .update({
          is_satisfied: satisfied,
          satisfied_at: satisfied ? new Date().toISOString() : null,
          satisfied_by: satisfied ? user?.id ?? null : null,
        })
        .eq("id", requirementId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addRequirement = useMutation({
    mutationFn: async (requirementType: Database["tasks"]["Enums"]["requirement_type"]) => {
      if (!taskId) throw new Error("no task id");
      const { error } = await tasksDb.from("task_requirements").insert({ task_id: taskId, requirement_type: requirementType });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRequirement = useMutation({
    mutationFn: async (requirementId: string) => {
      const { error } = await tasksDb.from("task_requirements").delete().eq("id", requirementId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addChecklist = useMutation({
    mutationFn: async (name: string) => {
      if (!taskId) return;
      const maxSort = (query.data?.checklists ?? []).reduce((m, c) => Math.max(m, c.sort_order), -1);
      const { error } = await tasksDb.from("checklists").insert({ task_id: taskId, name, sort_order: maxSort + 1 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addChecklistItem = useMutation({
    mutationFn: async ({ checklistId, content }: { checklistId: string; content: string }) => {
      const checklist = query.data?.checklists.find((c) => c.id === checklistId);
      const maxSort = (checklist?.items ?? []).reduce((m, i) => Math.max(m, i.sort_order), -1);
      const { error } = await tasksDb
        .from("checklist_items")
        .insert({ checklist_id: checklistId, content, sort_order: maxSort + 1 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const { error } = await tasksDb.from("checklist_items").update({ is_checked: checked }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addRelationship = useMutation({
    mutationFn: async ({
      relatedTaskId,
      type,
    }: {
      relatedTaskId: string;
      type: Database["tasks"]["Enums"]["relationship_type"];
    }) => {
      if (!taskId) return;
      const { error } = await tasksDb.from("task_relationships").insert({
        task_id: taskId,
        related_task_id: relatedTaskId,
        relationship_type: type,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Build plan §4.13: "reference rows are created automatically when
  // someone @mentions a task elsewhere" — called after saving a
  // description or comment whose text may contain "@[Title](id)" tokens
  // (mentionUtils.ts). Skips ids that already have a reference
  // relationship, since task_relationships has no uniqueness constraint
  // (known issue, tasks-module-db-summary.md §6) and re-saving the same
  // text repeatedly would otherwise pile up duplicate rows.
  const syncMentions = useMutation({
    mutationFn: async (text: string) => {
      if (!taskId || !query.data) return;
      const mentionedIds = extractMentionedTaskIds(text).filter((id) => id !== taskId);
      if (!mentionedIds.length) return;
      const alreadyReferenced = new Set(
        query.data.relationships.filter((r) => r.relationship_type === "reference").map((r) => r.related_task_id),
      );
      const toInsert = mentionedIds.filter((id) => !alreadyReferenced.has(id));
      if (!toInsert.length) return;
      const { error } = await tasksDb.from("task_relationships").insert(
        toInsert.map((relatedTaskId) => ({
          task_id: taskId,
          related_task_id: relatedTaskId,
          relationship_type: "reference" as const,
          created_by: user?.id ?? null,
        })),
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addSubtask = useMutation({
    mutationFn: async (title: string) => {
      if (!taskId || !query.data) return;
      const parent = query.data.task;
      const firstOpenStatus =
        query.data.statuses.find((s) => s.category === "not_started") ??
        query.data.statuses[0];
      if (!firstOpenStatus) throw new Error("لا توجد حالات معرّفة لهذه اللوحة");

      const { data: siblings, error: siblingsError } = await tasksDb
        .from("tasks")
        .select("sort_order")
        .eq("parent_task_id", taskId);
      if (siblingsError) throw siblingsError;
      const maxSort = (siblings ?? []).reduce((m, s) => Math.max(m, s.sort_order), -1);

      const { error } = await tasksDb.from("tasks").insert({
        board_id: parent.board_id,
        parent_task_id: taskId,
        title,
        status_id: firstOpenStatus.id,
        project_id: parent.project_id,
        department_id: parent.department_id,
        zone_id: parent.zone_id,
        created_by: user?.id ?? null,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeRelationship = useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await tasksDb.from("task_relationships").delete().eq("id", relationshipId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addLink = useMutation({
    mutationFn: async ({
      recordType,
      recordId,
      linkMode,
    }: {
      recordType: Database["tasks"]["Enums"]["link_record_type"];
      recordId: string;
      linkMode: Database["tasks"]["Enums"]["link_mode"];
    }) => {
      if (!taskId || !user?.id) throw new Error("no authenticated user");
      const { error } = await tasksDb.from("task_links").insert({
        task_id: taskId,
        record_type: recordType,
        record_id: recordId,
        link_mode: linkMode,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await tasksDb.from("task_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addComment = useMutation({
    mutationFn: async ({ text, parentCommentId }: { text: string; parentCommentId?: string | null }) => {
      if (!taskId || !user?.id) throw new Error("no authenticated user");
      const { error } = await tasksDb.from("task_comments").insert({
        task_id: taskId,
        parent_comment_id: parentCommentId ?? null,
        author_user_id: user.id,
        body: { text },
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const editComment = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await tasksDb
        .from("task_comments")
        .update({ body: { text }, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("task_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleCommentResolved = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await tasksDb.from("task_comments").update({ is_resolved: resolved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleTag = useMutation({
    mutationFn: async ({ tagId, attached }: { tagId: string; attached: boolean }) => {
      if (!taskId) throw new Error("no task id");
      if (attached) {
        const { error } = await tasksDb.from("task_tags").insert({ task_id: taskId, tag_id: tagId });
        if (error) throw error;
      } else {
        const { error } = await tasksDb.from("task_tags").delete().eq("task_id", taskId).eq("tag_id", tagId);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  // Hard delete, matching this module's other "danger zone" actions
  // (useSpaceSettings.ts's deleteBoard) rather than soft-archiving —
  // tasks_parent_task_id_fkey is ON DELETE CASCADE, so this also removes
  // every subtask underneath. The caller (TaskDetailPanel) navigates away
  // on success since the panel has nothing left to render.
  const deleteTask = useMutation({
    mutationFn: async () => {
      if (!taskId) throw new Error("no task id");
      const { error } = await tasksDb.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-board", query.data?.task.board_id] });
    },
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    updateField: updateField.mutate,
    setCustomValue: setCustomValue.mutate,
    setAssignees: setAssignees.mutate,
    satisfyRequirement: satisfyRequirement.mutate,
    addRequirement: addRequirement.mutate,
    deleteRequirement: deleteRequirement.mutate,
    addChecklist: addChecklist.mutate,
    addChecklistItem: addChecklistItem.mutate,
    toggleChecklistItem: toggleChecklistItem.mutate,
    addSubtask: addSubtask.mutate,
    addRelationship: addRelationship.mutate,
    removeRelationship: removeRelationship.mutate,
    syncMentions: syncMentions.mutate,
    addLink: addLink.mutateAsync,
    removeLink: removeLink.mutate,
    addComment: addComment.mutateAsync,
    editComment: editComment.mutateAsync,
    deleteComment: deleteComment.mutate,
    toggleCommentResolved: toggleCommentResolved.mutate,
    toggleTag: toggleTag.mutate,
    deleteTask: deleteTask.mutateAsync,
    deletingTask: deleteTask.isPending,
  };
}
