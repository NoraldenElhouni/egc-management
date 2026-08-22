import { ColumnDef } from "@tanstack/react-table";

/**
 * Config for a dynamic "count" column: a column whose value is looked up
 * from an externally-supplied `id -> count` map (e.g. contracts per project,
 * workers per project, etc.) rather than a field already on the row.
 */
export interface DynamicCountColumnConfig {
  /** Unique column id, also used to match version filters (e.g. "contracts_count"). */
  id: string;
  /** Column header label. */
  header: string;
  /** Map of row id -> count. */
  countMap: Record<string, number>;
  /** Whether to include this column. Defaults to true. */
  show?: boolean;
}

/**
 * Builds a ColumnDef for a dynamic count column from a config. Rows must
 * expose an `id` field used to look up the count in `countMap`.
 */
export function createCountColumn<TRow extends { id: string | number }>({
  id,
  header,
  countMap,
}: DynamicCountColumnConfig): ColumnDef<TRow> {
  return {
    id,
    header,
    accessorFn: (row) => countMap[row.id] ?? 0,
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<number>()}</span>
    ),
  };
}

/**
 * Filters and builds column defs for all count columns whose `show` is not
 * explicitly false.
 */
export function createCountColumns<TRow extends { id: string | number }>(
  configs: DynamicCountColumnConfig[] = [],
): ColumnDef<TRow>[] {
  return configs.filter((c) => c.show !== false).map((c) => createCountColumn<TRow>(c));
}
