import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";

// =====================================================================
// D4 — Template picker, build plan Part 7.
// =====================================================================
// copy_task_tree()'s actual body (pulled from the live DB — it isn't
// fully spelled out in the build plan doc) is the source of truth for
// how selection works:
//
//   - Only board_scope templates apply here (task_scope templates are
//     "drop this tree as a subtask of an existing task", a D3 action,
//     not this screen).
//   - The function's own recursive CTE walks a template tree gated on
//     each node's is_selected_by_default — "root is always included,
//     regardless of its own flag" (the function's own SQL comment), and
//     a false-flagged node stops the walk into its whole subtree. That
//     IS the "deselecting a parent greys out and unchecks its whole
//     subtree" mechanic from the build plan — it isn't reimplemented
//     client-side, it's the literal DB behavior.
//   - Because of that, this screen's checkboxes are literally
//     template_tasks.is_selected_by_default. Toggling one here and
//     hitting confirm writes it back before calling the RPC, which does
//     mean a deselection here changes the template's default for the
//     next person who applies it too — that's this app's actual chosen
//     design (the SQL comment reads as deliberate), not a shortcut.
//   - A top-level (root) task's own checkbox has nowhere to live in that
//     column (the RPC ignores it), so unchecking a whole top-level
//     branch just means "don't call copy_task_tree for this root at
//     all" — tracked client-side only, per application.
//   - board_columns (attaching a template's fields to the target board)
//     is NOT something copy_task_tree touches — it only writes
//     tasks/task_values/requirements/checklists. The "fields merged,
//     duplicates removed" footer promise is handled here, separately.

export type Template = Database["tasks"]["Tables"]["templates"]["Row"];
export type TemplateTask = Database["tasks"]["Tables"]["template_tasks"]["Row"];

export interface TargetBoard {
  id: string;
  label: string; // zone name if bound to one, else the board's own name
}

export interface TemplatePickerData {
  templates: Template[];
  templateTasksByTemplate: Map<string, TemplateTask[]>;
  taskCountByTemplate: Map<string, number>;
  fieldDefIdsByTemplate: Map<string, string[]>;
  fieldDefNamesById: Map<string, string>;
  departmentNamesById: Map<string, string>;
  targetBoards: TargetBoard[];
}

export function useTemplatePicker(spaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["template-picker", spaceId],
    enabled: !!spaceId,
    queryFn: async (): Promise<TemplatePickerData> => {
      if (!spaceId) throw new Error("no space id");

      const { data: templates, error: templatesError } = await tasksDb
        .from("templates")
        .select("*")
        .eq("template_scope", "board")
        .order("name_ar");
      if (templatesError) throw templatesError;

      const templateIds = (templates ?? []).map((t) => t.id);

      const [
        { data: templateTasks, error: templateTasksError },
        { data: templateFieldRows, error: templateFieldError },
        { data: departmentRows, error: departmentError },
        { data: boardRows, error: boardsError },
      ] = await Promise.all([
        templateIds.length
          ? tasksDb.from("template_tasks").select("*").in("template_id", templateIds).order("sort_order")
          : Promise.resolve({ data: [], error: null }),
        templateIds.length
          ? tasksDb.from("template_field_definitions").select("template_id, field_definition_id").in("template_id", templateIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("departments").select("id, name_ar, name").eq("is_active", true),
        tasksDb.from("boards").select("id, name, zone_id").eq("space_id", spaceId).eq("is_archived", false),
      ]);
      if (templateTasksError) throw templateTasksError;
      if (templateFieldError) throw templateFieldError;
      if (departmentError) throw departmentError;
      if (boardsError) throw boardsError;

      const zoneIds = Array.from(new Set((boardRows ?? []).map((b) => b.zone_id).filter(Boolean))) as string[];
      const { data: zoneRows, error: zoneError } = zoneIds.length
        ? await supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
        : { data: [], error: null };
      if (zoneError) throw zoneError;
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      const fieldDefIds = Array.from(new Set((templateFieldRows ?? []).map((r) => r.field_definition_id)));
      const { data: fieldDefs, error: fieldDefsError } = fieldDefIds.length
        ? await tasksDb.from("field_definitions").select("id, name_ar").in("id", fieldDefIds)
        : { data: [], error: null };
      if (fieldDefsError) throw fieldDefsError;

      const templateTasksByTemplate = new Map<string, TemplateTask[]>();
      const taskCountByTemplate = new Map<string, number>();
      for (const tt of templateTasks ?? []) {
        const list = templateTasksByTemplate.get(tt.template_id) ?? [];
        list.push(tt);
        templateTasksByTemplate.set(tt.template_id, list);
        taskCountByTemplate.set(tt.template_id, (taskCountByTemplate.get(tt.template_id) ?? 0) + 1);
      }

      const fieldDefIdsByTemplate = new Map<string, string[]>();
      for (const row of templateFieldRows ?? []) {
        const list = fieldDefIdsByTemplate.get(row.template_id) ?? [];
        list.push(row.field_definition_id);
        fieldDefIdsByTemplate.set(row.template_id, list);
      }

      return {
        templates: templates ?? [],
        templateTasksByTemplate,
        taskCountByTemplate,
        fieldDefIdsByTemplate,
        fieldDefNamesById: new Map((fieldDefs ?? []).map((f) => [f.id, f.name_ar])),
        departmentNamesById: new Map((departmentRows ?? []).map((d) => [d.id, d.name_ar ?? d.name])),
        targetBoards: (boardRows ?? []).map((b) => ({
          id: b.id,
          label: b.zone_id ? (zoneNameById.get(b.zone_id) ?? b.name) : b.name,
        })),
      };
    },
  });

  const apply = useMutation({
    mutationFn: async ({
      selectedRootIds,
      changedSelections,
      targetBoardIds,
      anchorDate,
    }: {
      selectedRootIds: string[]; // top-level template_tasks to actually copy
      changedSelections: { id: string; selected: boolean }[]; // non-root nodes whose checkbox changed
      targetBoardIds: string[];
      anchorDate: string;
    }) => {
      if (!user?.id) throw new Error("no authenticated user");

      const turnedOn = changedSelections.filter((c) => c.selected).map((c) => c.id);
      const turnedOff = changedSelections.filter((c) => !c.selected).map((c) => c.id);
      if (turnedOn.length) {
        const { error } = await tasksDb.from("template_tasks").update({ is_selected_by_default: true }).in("id", turnedOn);
        if (error) throw error;
      }
      if (turnedOff.length) {
        const { error } = await tasksDb.from("template_tasks").update({ is_selected_by_default: false }).in("id", turnedOff);
        if (error) throw error;
      }

      for (const boardId of targetBoardIds) {
        for (const rootId of selectedRootIds) {
          const { error } = await tasksDb.rpc("copy_task_tree", {
            p_source_type: "template",
            p_source_root_id: rootId,
            p_target_board_id: boardId,
            p_anchor_date: anchorDate,
            p_created_by: user.id,
          });
          if (error) throw error;
        }
      }

      return { targetBoardIds };
    },
    onSuccess: ({ targetBoardIds }) => {
      for (const boardId of targetBoardIds) {
        queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
      }
    },
  });

  const attachFields = useMutation({
    mutationFn: async ({
      fieldDefinitionIds,
      targetBoardIds,
    }: {
      fieldDefinitionIds: string[];
      targetBoardIds: string[];
    }) => {
      if (fieldDefinitionIds.length === 0) return;
      for (const boardId of targetBoardIds) {
        const { data: existing, error: existingError } = await tasksDb
          .from("board_columns")
          .select("field_definition_id, sort_order")
          .eq("board_id", boardId);
        if (existingError) throw existingError;

        const existingIds = new Set((existing ?? []).map((c) => c.field_definition_id));
        const maxSort = (existing ?? []).reduce((m, c) => Math.max(m, c.sort_order), -1);
        const missing = fieldDefinitionIds.filter((id) => !existingIds.has(id));
        if (missing.length === 0) continue;

        const { error } = await tasksDb.from("board_columns").insert(
          missing.map((field_definition_id, i) => ({
            board_id: boardId,
            field_definition_id,
            sort_order: maxSort + 1 + i,
          })),
        );
        if (error) throw error;
      }
    },
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    apply: apply.mutateAsync,
    applying: apply.isPending,
    attachFields: attachFields.mutateAsync,
  };
}

// Selection state for the merged preview — kept out of the data hook
// since it's pure client-side UI state, not server data.
export function useTemplateSelection() {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [excludedRootIds, setExcludedRootIds] = useState<Set<string>>(new Set());
  const [nodeOverrides, setNodeOverrides] = useState<Map<string, boolean>>(new Map());

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRoot = (id: string) => {
    setExcludedRootIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNode = (id: string, currentDefault: boolean) => {
    setNodeOverrides((prev) => {
      const next = new Map(prev);
      const current = next.get(id) ?? currentDefault;
      next.set(id, !current);
      return next;
    });
  };

  const isNodeSelected = (id: string, defaultSelected: boolean) =>
    nodeOverrides.get(id) ?? defaultSelected;

  const reset = () => {
    setSelectedTemplateIds(new Set());
    setExcludedRootIds(new Set());
    setNodeOverrides(new Map());
  };

  return {
    selectedTemplateIds,
    toggleTemplate,
    excludedRootIds,
    toggleRoot,
    nodeOverrides,
    toggleNode,
    isNodeSelected,
    reset,
  };
}
