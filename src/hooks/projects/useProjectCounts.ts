import { useQueries } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

// The generated Database type carries a "__InternalSupabase" marker key
// alongside the real schema names — not a schema `.schema()` accepts.
type SchemaName = Exclude<keyof Database, "__InternalSupabase">;

// =====================================================================
// One "how many rows does each project have in table X" counter, for
// any table with a project_id column.
// =====================================================================
// Replaces useContractCountsByProject / useOrderCountsByProject, which
// were the same fetch-and-group-by-project_id logic copied per feature.
// Adding a new counter anywhere ProjectsList is used — BOQ zones today,
// whatever's next tomorrow — is passing one more ProjectCountSource, not
// writing a new hook and a new branch in ProjectsList.
// =====================================================================

export interface ProjectCountSource {
  /** Column id in the resulting table, and the react-query cache key. */
  id: string;
  header: string;
  table: string;
  /** Defaults to "public". */
  schema?: SchemaName;
  /** Defaults to "project_id". */
  projectIdColumn?: string;
}

export interface ProjectCountResult {
  id: string;
  header: string;
  countMap: Record<string, number>;
  loading: boolean;
}

interface GenericPostgrestClient {
  from: (table: string) => {
    select: (columns: string) => Promise<{
      data: Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  };
}

interface GenericSupabaseClient extends GenericPostgrestClient {
  schema: (name: string) => GenericPostgrestClient;
}

async function fetchProjectCounts(
  source: ProjectCountSource,
): Promise<Record<string, number>> {
  const column = source.projectIdColumn ?? "project_id";

  // Supabase's generated types are one literal signature per
  // schema-and-table; a source whose schema/table/column are runtime
  // strings — the entire point of this hook, which must work for any
  // table with a project_id column — can't be expressed as any single
  // one of those signatures. `supabase.schema(source.schema)` unioned
  // with plain `supabase` is exactly that: two clients typed for
  // different schemas, so `.from()` on the union isn't callable at all.
  // Cast to one minimal, non-overloaded shape for this one fetch;
  // ProjectCountSource/ProjectCountResult above stay fully typed, so
  // every caller keeps the same safety as before.
  const client = supabase as unknown as GenericSupabaseClient;
  const query = source.schema ? client.schema(source.schema) : client;

  const { data, error } = await query.from(source.table).select(column);
  if (error) throw new Error(error.message);

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const projectId = row[column] as string | null;
    if (!projectId) return acc;
    acc[projectId] = (acc[projectId] ?? 0) + 1;
    return acc;
  }, {});
}

export function useProjectCounts(
  sources: ProjectCountSource[],
): ProjectCountResult[] {
  const results = useQueries({
    queries: sources.map((source) => ({
      queryKey: [
        "project-counts",
        source.schema ?? "public",
        source.table,
        source.projectIdColumn ?? "project_id",
      ],
      queryFn: () => fetchProjectCounts(source),
      staleTime: 30_000,
    })),
  });

  return sources.map((source, i) => ({
    id: source.id,
    header: source.header,
    countMap: results[i].data ?? {},
    loading: results[i].isPending,
  }));
}
