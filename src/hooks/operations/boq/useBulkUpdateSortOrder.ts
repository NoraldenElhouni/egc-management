import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { SortableTable } from "./sortOrder";

export type UpsertRow = { id: string; sort_order: number } & Record<
  string,
  unknown
>;

/**
 * Persists a new sort_order for many rows of one table in a single request.
 * Uses upsert (ON CONFLICT DO UPDATE) rather than .update(), since .update()
 * can only apply one value to every matched row and each sibling here needs
 * a different sort_order.
 *
 * NOTE: Postgres validates NOT NULL constraints while constructing the
 * (hypothetical) row to insert *before* it even checks for a conflict, so
 * a payload of just {id, sort_order} fails on any table with other
 * required columns — ON CONFLICT DO UPDATE does not exempt them. Callers
 * must include every NOT-NULL-without-default column for the target
 * table, not just the columns actually changing.
 */
export function useBulkUpdateSortOrder(table: SortableTable) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function bulkUpdateSortOrder(updates: UpsertRow[]) {
    if (updates.length === 0) return { error: null };

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .schema("boq")
      .from(table)
      .upsert(updates as never[], { onConflict: "id" });

    setLoading(false);
    if (error) {
      console.error(`error bulk updating sort_order on ${table}`, error);
      setError(error);
      return { error };
    }
    return { error: null };
  }

  return { bulkUpdateSortOrder, loading, error };
}
