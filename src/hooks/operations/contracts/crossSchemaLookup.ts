import { supabase } from "../../../lib/supabaseClient";
import { Database } from "../../../lib/supabase";

type PublicTableName = keyof Database["public"]["Tables"];

// PostgREST cannot embed a join across schemas (e.g. querying the
// `contracts` schema and embedding a `public.contractors` row) — every
// cross-schema FK in the `contracts` schema (contractor_id, project_id,
// specialization_id, created_by, requested_by, ...) has to be resolved
// with a separate batched lookup into `public`, then merged client-side.
export async function fetchByIds<T extends { id: string }>(
  table: PublicTableName,
  columns: string,
  ids: (string | null | undefined)[],
): Promise<Record<string, T>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .in("id", uniqueIds);

  if (error || !data) return {};

  return (data as unknown as T[]).reduce<Record<string, T>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
}
