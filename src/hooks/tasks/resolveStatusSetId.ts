import { supabase } from "../../lib/supabaseClient";

// Shared by useTaskBoard, useTaskDetail, and useTaskDirectory (its own
// createTask mutation). resolve_status_set(board_id) is
// documented in the build plan (§4.3) but does NOT appear in the live
// schema's RPC surface (confirmed via `supabase gen types` against the
// linked project) — replicated here client-side instead of calling a
// function that doesn't exist: board's own status_set_id -> its space's
// -> the global default (status_sets.is_default = true, space_id null).
export async function resolveStatusSetId(
  boardStatusSetId: string | null,
  spaceId: string,
): Promise<string> {
  const tasksDb = supabase.schema("tasks");
  if (boardStatusSetId) return boardStatusSetId;

  const { data: space, error: spaceError } = await tasksDb
    .from("spaces")
    .select("status_set_id")
    .eq("id", spaceId)
    .single();
  if (spaceError) throw spaceError;
  if (space.status_set_id) return space.status_set_id;

  const { data: globalSet, error: globalError } = await tasksDb
    .from("status_sets")
    .select("id")
    .is("space_id", null)
    .eq("is_default", true)
    .single();
  if (globalError) throw globalError;
  return globalSet.id;
}
