import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

// Shared by useTemplatePicker (D4) and useZoneClone (D5) — both call the
// same tasks.copy_task_tree() RPC (build plan §5.1, "one copy function").
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
