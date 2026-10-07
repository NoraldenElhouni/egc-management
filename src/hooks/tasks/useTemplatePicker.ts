import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import { callApplyTemplateBoard } from "./copyTaskTree";
import { notifyNewAssignees } from "../../services/tasks/notifyNewAssignees";

// =====================================================================
// D4 — Template picker, build plan Part 7.
// =====================================================================
// A template is a board with is_template = true (see useTemplatesAdmin.ts),
// so the preview tree is just that board's tasks. Applying one is a single
// tasks.apply_template_board() call per (template × target board), which
// copies the whole tree plus everything hanging off it — assignees,
// checklists, requirements, custom values, dependencies, relationships,
// tags, record links, attachments, recurrence rules and the template's
// board columns.
//
// Unchecking a node in the preview adds it to that one application's
// excluded ids; the RPC's tree walk stops at an excluded node, so its
// whole subtree is skipped too. Nothing is written back to the template.

type TaskRow = Database["tasks"]["Tables"]["tasks"]["Row"];

export type TemplateTask = Pick<
  TaskRow,
  "id" | "board_id" | "parent_task_id" | "title" | "department_id" | "start_date" | "due_date" | "sort_order"
>;

export interface Template {
  id: string;
  name: string;
}

export interface TargetBoard {
  id: string;
  label: string; // zone name if bound to one, else the board's own name
}

export interface TemplatePickerData {
  templates: Template[];
  templateTasksByTemplate: Map<string, TemplateTask[]>;
  assigneeCountByTask: Map<string, number>;
  columnNamesByTemplate: Map<string, string[]>;
  departmentNamesById: Map<string, string>;
  targetBoards: TargetBoard[];
}

/** `currentBoardIsTemplate`: when the picker is opened on a template
 * board, the only sensible target is that template itself (building one
 * template out of others); otherwise targets are the space's real boards. */
export function useTemplatePicker(spaceId: string | undefined, currentBoardId: string, currentBoardIsTemplate: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["template-picker", spaceId, currentBoardId],
    enabled: !!spaceId,
    queryFn: async (): Promise<TemplatePickerData> => {
      if (!spaceId) throw new Error("no space id");

      const { data: templateRows, error: templatesError } = await tasksDb
        .from("boards")
        .select("id, name")
        .eq("is_template", true)
        .eq("is_archived", false)
        .neq("id", currentBoardId)
        .order("name");
      if (templatesError) throw templatesError;

      const templateIds = (templateRows ?? []).map((t) => t.id);

      const targetQuery = currentBoardIsTemplate
        ? tasksDb.from("boards").select("id, name, zone_id").eq("id", currentBoardId)
        : tasksDb
            .from("boards")
            .select("id, name, zone_id")
            .eq("space_id", spaceId)
            .eq("is_archived", false)
            .eq("is_template", false);

      const [
        { data: templateTasks, error: templateTasksError },
        { data: columnRows, error: columnsError },
        { data: departmentRows, error: departmentError },
        { data: boardRows, error: boardsError },
      ] = await Promise.all([
        templateIds.length
          ? tasksDb
              .from("tasks")
              .select("id, board_id, parent_task_id, title, department_id, start_date, due_date, sort_order")
              .in("board_id", templateIds)
              .eq("is_archived", false)
              .order("sort_order")
          : Promise.resolve({ data: [] as TemplateTask[], error: null }),
        templateIds.length
          ? tasksDb.from("board_columns").select("board_id, field_definition_id").in("board_id", templateIds)
          : Promise.resolve({ data: [] as { board_id: string; field_definition_id: string }[], error: null }),
        supabase.from("departments").select("id, name_ar, name").eq("is_active", true),
        targetQuery,
      ]);
      if (templateTasksError) throw templateTasksError;
      if (columnsError) throw columnsError;
      if (departmentError) throw departmentError;
      if (boardsError) throw boardsError;

      const taskIds = (templateTasks ?? []).map((t) => t.id);
      const fieldDefIds = Array.from(new Set((columnRows ?? []).map((r) => r.field_definition_id)));
      const zoneIds = Array.from(new Set((boardRows ?? []).map((b) => b.zone_id).filter(Boolean))) as string[];

      const [
        { data: assigneeRows, error: assigneeError },
        { data: fieldDefs, error: fieldDefsError },
        { data: zoneRows, error: zoneError },
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("task_assignees").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [] as { task_id: string }[], error: null }),
        fieldDefIds.length
          ? tasksDb.from("field_definitions").select("id, name_ar").in("id", fieldDefIds)
          : Promise.resolve({ data: [] as { id: string; name_ar: string }[], error: null }),
        zoneIds.length
          ? supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (fieldDefsError) throw fieldDefsError;
      if (zoneError) throw zoneError;

      const templateTasksByTemplate = new Map<string, TemplateTask[]>();
      for (const t of templateTasks ?? []) {
        const list = templateTasksByTemplate.get(t.board_id) ?? [];
        list.push(t);
        templateTasksByTemplate.set(t.board_id, list);
      }

      const assigneeCountByTask = new Map<string, number>();
      for (const row of assigneeRows ?? []) {
        assigneeCountByTask.set(row.task_id, (assigneeCountByTask.get(row.task_id) ?? 0) + 1);
      }

      const fieldNameById = new Map((fieldDefs ?? []).map((f) => [f.id, f.name_ar]));
      const columnNamesByTemplate = new Map<string, string[]>();
      for (const row of columnRows ?? []) {
        const list = columnNamesByTemplate.get(row.board_id) ?? [];
        list.push(fieldNameById.get(row.field_definition_id) ?? "");
        columnNamesByTemplate.set(row.board_id, list);
      }

      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      return {
        templates: templateRows ?? [],
        templateTasksByTemplate,
        assigneeCountByTask,
        columnNamesByTemplate,
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
      templateIds,
      excludedIds,
      targetBoardIds,
      anchorDate,
      roleOverrides,
    }: {
      templateIds: string[];
      excludedIds: string[];
      targetBoardIds: string[];
      anchorDate: string;
      /** {boardId: {roleId: [userIds]}} — picks for project roles nobody
       * holds on that board's project (RoleGapsSection.tsx). */
      roleOverrides: Record<string, Record<string, string[]>>;
    }) => {
      if (!user?.id) throw new Error("no authenticated user");

      const newTaskIds: string[] = [];
      for (const boardId of targetBoardIds) {
        for (const templateId of templateIds) {
          newTaskIds.push(
            ...(await callApplyTemplateBoard({
              templateBoardId: templateId,
              targetBoardId: boardId,
              anchorDate,
              createdBy: user.id,
              excludedIds,
              roleOverrides: roleOverrides[boardId] ?? {},
            })),
          );
        }
      }

      // people (named, or resolved from a project role) were assigned
      // server-side; tell them
      void notifyNewAssignees(newTaskIds, user.id);
      return { targetBoardIds };
    },
    onSuccess: ({ targetBoardIds }) => {
      for (const boardId of targetBoardIds) {
        queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
      }
      queryClient.invalidateQueries({ queryKey: ["templates-admin"] });
    },
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    apply: apply.mutateAsync,
    applying: apply.isPending,
  };
}

// Selection state for the merged preview — kept out of the data hook
// since it's pure client-side UI state, not server data. Per application
// only: nothing here is written back to the template.
export function useTemplateSelection() {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNode = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExcluded = (id: string) => excludedIds.has(id);

  // Bulk version of toggleNode, for the select-all / select-none buttons.
  // Select all = un-exclude every node of the template(s); select none =
  // exclude just the root nodes (their subtasks then read as ancestor-
  // excluded, and the copy walk stops at an excluded node anyway).
  const setExcluded = (ids: string[], excluded: boolean) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (excluded) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const reset = () => {
    setSelectedTemplateIds(new Set());
    setExcludedIds(new Set());
  };

  return {
    selectedTemplateIds,
    toggleTemplate,
    excludedIds,
    toggleNode,
    setExcluded,
    isExcluded,
    reset,
  };
}
