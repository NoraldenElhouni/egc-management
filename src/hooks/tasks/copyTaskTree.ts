import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

// Used by useZoneClone (D5) directly and by useTemplatePicker (D4) through
// apply_template_board() below — both end up in the same
// tasks.copy_task_tree() RPC (build plan §5.1, "one copy function").
//
// copy_task_tree() does its work in two passes through a session-scoped
// temporary table (_copy_map): pass 1 assigns every new row's id, pass 2
// inserts rows and looks up each one's *new* parent id from that table.
// Under Supabase's pooled connections this has been observed to
// intermittently fail — "violates foreign key constraint
// tasks_parent_task_id_fkey" — on a call with perfectly valid inputs,
// then succeed identically on an immediate retry with no state changed.
// That signature (same inputs, non-deterministic result) points at a
// connection-reuse artifact around the temp table rather than a real bad
// input, which would fail the same way every time. One silent retry
// absorbs it; a genuinely bad input still fails on the retry too and
// surfaces normally.
export async function callCopyTaskTree(args: {
  sourceType: Database["tasks"]["Enums"]["copy_source_type"];
  sourceRootId: string;
  targetBoardId: string;
  anchorDate: string;
  createdBy: string;
}): Promise<void> {
  const tasksDb = supabase.schema("tasks");
  const run = () =>
    tasksDb.rpc("copy_task_tree", {
      p_source_type: args.sourceType,
      p_source_root_id: args.sourceRootId,
      p_target_board_id: args.targetBoardId,
      p_anchor_date: args.anchorDate,
      p_created_by: args.createdBy,
    });

  let { error } = await run();
  if (error) {
    ({ error } = await run());
  }
  if (error) throw error;
}

// Applies a whole template board (boards.is_template) onto a board in one
// RPC: tasks.apply_template_board() calls copy_task_tree() once per root
// and then recreates dependencies, relationships, tags, record links,
// attachments, recurrence rules and board columns between the copies.
// Same temp-table mechanism underneath, so the same one silent retry.
export async function callApplyTemplateBoard(args: {
  templateBoardId: string;
  targetBoardId: string;
  anchorDate: string;
  createdBy: string;
  excludedIds: string[];
}): Promise<number> {
  const tasksDb = supabase.schema("tasks");
  const run = () =>
    tasksDb.rpc("apply_template_board", {
      p_template_board_id: args.templateBoardId,
      p_target_board_id: args.targetBoardId,
      p_anchor_date: args.anchorDate,
      p_created_by: args.createdBy,
      p_excluded_ids: args.excludedIds,
    });

  let { data, error } = await run();
  if (error) {
    ({ data, error } = await run());
  }
  if (error) throw error;
  return data ?? 0;
}

// Copies chosen template tasks (with their subtrees) onto each target
// board that doesn't have them yet — tasks.push_template_tasks(). Each
// copy lands under the target's copy of its template parent when there is
// one, dated from the Day 0 the board was built with (or defaultAnchor
// when that can't be worked out). Returns the new task ids.
export async function callPushTemplateTasks(args: {
  templateBoardId: string;
  taskIds: string[];
  targetBoardIds: string[];
  defaultAnchor: string;
  createdBy: string;
}): Promise<string[]> {
  const tasksDb = supabase.schema("tasks");
  const run = () =>
    tasksDb.rpc("push_template_tasks", {
      p_template_board_id: args.templateBoardId,
      p_task_ids: args.taskIds,
      p_target_board_ids: args.targetBoardIds,
      p_default_anchor: args.defaultAnchor,
      p_created_by: args.createdBy,
    });

  let { data, error } = await run();
  if (error) {
    ({ data, error } = await run());
  }
  if (error) throw error;
  return (data ?? []).map((r) => r.new_task_id);
}

// Copies tasks added by hand on a real board into its template —
// tasks.add_tasks_to_template() — and links the originals back to the new
// template tasks. Returns the new template task ids.
export async function callAddTasksToTemplate(args: {
  taskIds: string[];
  templateBoardId: string;
  createdBy: string;
}): Promise<string[]> {
  const tasksDb = supabase.schema("tasks");
  const run = () =>
    tasksDb.rpc("add_tasks_to_template", {
      p_task_ids: args.taskIds,
      p_template_board_id: args.templateBoardId,
      p_created_by: args.createdBy,
    });

  let { data, error } = await run();
  if (error) {
    ({ data, error } = await run());
  }
  if (error) throw error;
  return (data ?? []).map((r) => r.template_task_id);
}
