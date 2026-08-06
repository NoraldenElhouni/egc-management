export type SortableTable =
  | "types"
  | "zones"
  | "works"
  | "items"
  | "template_types"
  | "template_works"
  | "template_items";

/**
 * Next sort_order for a new sibling: one past the current max, or 0 if this
 * is the first item in the parent.
 */
export function computeNextSortOrder(siblings: { sort_order: number }[]): number {
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((s) => s.sort_order)) + 1;
}
