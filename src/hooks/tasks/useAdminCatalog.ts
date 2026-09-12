import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database, Json } from "../../lib/supabase";

// =====================================================================
// D11 — Admin: fields, tags, task types (build plan Part 7, §4.9/4.11).
// =====================================================================
// "So nobody creates a fifth Supplier" is the whole point of the field
// manager — usage counts are the thing that makes reuse visible.
// field_definitions/tags both cascade-delete their usages at the DB
// level (board_columns/task_values, task_tags) — there's no soft
// delete, so the UI must show the usage count in the delete
// confirmation rather than silently wiping live task data.

export type FieldDefinition = Database["tasks"]["Tables"]["field_definitions"]["Row"];
export type Tag = Database["tasks"]["Tables"]["tags"]["Row"];
export type TaskType = Database["tasks"]["Tables"]["task_types"]["Row"];
export type FieldType = Database["tasks"]["Enums"]["field_type"];

export interface FieldOption {
  id: string;
  label_ar: string;
  color: string;
}

export interface FieldWithUsage extends FieldDefinition {
  boardCount: number;
}
export interface TagWithUsage extends Tag {
  taskCount: number;
}

export function useAdminCatalog() {
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["admin-catalog"];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const [
        { data: fields, error: fieldsError },
        { data: boardColumns, error: boardColumnsError },
        { data: tags, error: tagsError },
        { data: taskTags, error: taskTagsError },
        { data: taskTypes, error: taskTypesError },
      ] = await Promise.all([
        tasksDb.from("field_definitions").select("*").order("name_ar"),
        tasksDb.from("board_columns").select("field_definition_id"),
        tasksDb.from("tags").select("*").order("name"),
        tasksDb.from("task_tags").select("tag_id"),
        tasksDb.from("task_types").select("*").order("name_ar"),
      ]);
      if (fieldsError) throw fieldsError;
      if (boardColumnsError) throw boardColumnsError;
      if (tagsError) throw tagsError;
      if (taskTagsError) throw taskTagsError;
      if (taskTypesError) throw taskTypesError;

      const boardCountByField = new Map<string, number>();
      for (const row of boardColumns ?? []) {
        boardCountByField.set(row.field_definition_id, (boardCountByField.get(row.field_definition_id) ?? 0) + 1);
      }
      const taskCountByTag = new Map<string, number>();
      for (const row of taskTags ?? []) {
        taskCountByTag.set(row.tag_id, (taskCountByTag.get(row.tag_id) ?? 0) + 1);
      }

      return {
        fields: (fields ?? []).map((f) => ({ ...f, boardCount: boardCountByField.get(f.id) ?? 0 })) as FieldWithUsage[],
        tags: (tags ?? []).map((t) => ({ ...t, taskCount: taskCountByTag.get(t.id) ?? 0 })) as TagWithUsage[],
        taskTypes: taskTypes ?? [],
      };
    },
  });

  const createField = useMutation({
    mutationFn: async (input: { name: string; name_ar: string; type: FieldType; config: Json }) => {
      const { error } = await tasksDb.from("field_definitions").insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const updateFieldConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Json }) => {
      const { error } = await tasksDb.from("field_definitions").update({ config }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("field_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createTag = useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const { error } = await tasksDb.from("tags").insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createTaskType = useMutation({
    mutationFn: async (input: { name: string; name_ar: string; color: string }) => {
      const { error } = await tasksDb.from("task_types").insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const updateTaskType = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TaskType> }) => {
      const { error } = await tasksDb.from("task_types").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const deleteTaskType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("task_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    createField: createField.mutateAsync,
    updateFieldConfig: updateFieldConfig.mutateAsync,
    deleteField: deleteField.mutateAsync,
    createTag: createTag.mutateAsync,
    deleteTag: deleteTag.mutateAsync,
    createTaskType: createTaskType.mutateAsync,
    updateTaskType: updateTaskType.mutateAsync,
    deleteTaskType: deleteTaskType.mutateAsync,
  };
}
