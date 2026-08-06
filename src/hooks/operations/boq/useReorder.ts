import { useBulkUpdateSortOrder, UpsertRow } from "./useBulkUpdateSortOrder";
import { SortableTable } from "./sortOrder";

/**
 * Optimistic drag-and-drop reorder: applies the new order to local state
 * immediately, persists the recomputed sort_order for every affected
 * sibling in one request, and rolls back (via onError) if that fails.
 *
 * `toUpsertRow` builds the full upsert payload for one sibling — it must
 * include every NOT-NULL-without-default column for `table`, not just
 * id/sort_order (see useBulkUpdateSortOrder for why).
 */
export function useReorder(table: SortableTable) {
  const { bulkUpdateSortOrder, loading } = useBulkUpdateSortOrder(table);

  async function reorder<T extends { id: string; sort_order: number }>(
    reorderedSiblings: T[],
    toUpsertRow: (item: T) => UpsertRow,
    applyOptimistic: (next: T[]) => void,
    onError: () => void,
  ) {
    const withNewOrder = reorderedSiblings.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    applyOptimistic(withNewOrder);

    const { error } = await bulkUpdateSortOrder(withNewOrder.map(toUpsertRow));
    if (error) onError();
  }

  return { reorder, loading };
}
