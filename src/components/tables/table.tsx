import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  Table,
  FilterFn,
} from "@tanstack/react-table";
import Button from "../ui/Button";
import { Link } from "react-router-dom";
import { ButtonVariant } from "../../types/global.type";

// ── Custom filter functions ───────────────────────────────────────────────────

/**
 * Date-range filter.
 * Column filter value: [fromISO?: string, toISO?: string]
 * Cell value: a date string parseable by `new Date()`
 */
const dateRangeFilter: FilterFn<unknown> = (row, columnId, value) => {
  const [from, to] = value as [string | undefined, string | undefined];
  const raw = row.getValue(columnId) as string;
  if (!raw) return false;
  const date = new Date(raw).getTime();
  const fromMs = from ? new Date(from).getTime() : -Infinity;
  const toMs = to ? new Date(to + "T23:59:59").getTime() : Infinity;
  return date >= fromMs && date <= toMs;
};
dateRangeFilter.autoRemove = (val: unknown) => {
  const [a, b] = (val ?? []) as [unknown, unknown];
  return !a && !b;
};

/**
 * Numeric range filter.
 * Column filter value: [min?: number, max?: number]
 */
const numberRangeFilter: FilterFn<unknown> = (row, columnId, value) => {
  const [min, max] = value as [number | undefined, number | undefined];
  const num = Number(row.getValue(columnId) ?? 0);
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};
numberRangeFilter.autoRemove = (val: unknown) => {
  const [a, b] = (val ?? []) as [unknown, unknown];
  return a === undefined && b === undefined;
};

// Register custom filter functions so TanStack can resolve them by name
const filterFns = { dateRangeFilter, numberRangeFilter } as const;

// ── Props ─────────────────────────────────────────────────────────────────────

type GenericTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  initialSorting?: SortingState;
  pageSize?: number;
  enableSorting?: boolean;
  enablePagination?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  showGlobalFilter?: boolean;
  onRowClick?: (row: TData) => void;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  className?: string;
  emptyMessage?: string;

  /** Legacy: arbitrary node shown on the left of the top bar */
  header?: React.ReactNode;

  /**
   * Render prop – receives the live TanStack `table` instance so callers can
   * build rich filter UIs (e.g. <ExpenseTableFilters table={table} />).
   * Rendered directly above the table, below the header bar.
   */
  headerActions?: (table: Table<TData>) => React.ReactNode;

  link?: string;
  linkLabel?: string;
  linkVariant?: ButtonVariant;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenericTable<TData extends object>({
  data,
  columns,
  initialSorting = [],
  pageSize = 10000,
  enableSorting = true,
  enablePagination = false,
  enableFiltering = false,
  enableRowSelection = false,
  showGlobalFilter = false,
  onRowClick,
  onRowSelectionChange,
  className = "",
  emptyMessage = "لا توجد بيانات لعرضها.",
  header,
  headerActions,
  link,
  linkLabel,
  linkVariant,
}: GenericTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    filterFns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    enableRowSelection: enableRowSelection,
    initialState: {
      pagination: { pageSize },
    },
    debugTable: false,
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (enableRowSelection && onRowSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, enableRowSelection, onRowSelectionChange, table]);

  return (
    <div className={`w-full overflow-auto p-2 ${className}`}>
      {/* ── Top bar: legacy header + optional link ── */}
      {(header || link) && (
        <div className="mb-4 flex justify-between items-center">
          {header && <div>{header}</div>}
          {link && (
            <Button variant={linkVariant || "primary"}>
              <Link to={link}>{linkLabel}</Link>
            </Button>
          )}
        </div>
      )}

      {/* ── Header actions (filter panel render prop) ── */}
      {headerActions && (
        <div className="mb-4">
          {headerActions(table as unknown as Table<TData>)}
        </div>
      )}

      {/* ── Global Filter ── */}
      {showGlobalFilter && enableFiltering && (
        <div className="mb-3">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="بحث في كل الأعمدة..."
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* ── Selection info ── */}
      {enableRowSelection && Object.keys(rowSelection).length > 0 && (
        <div className="mb-2 text-sm text-blue-600">
          {Object.keys(rowSelection).length} صف محدد
        </div>
      )}

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto border rounded">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((col) => (
                  <th
                    key={col.id}
                    colSpan={col.colSpan}
                    className="py-3 px-4 font-semibold text-sm select-none border-b border-gray-200"
                  >
                    {col.isPlaceholder ? null : (
                      <div
                        onClick={
                          col.column.getCanSort() && enableSorting
                            ? col.column.getToggleSortingHandler()
                            : undefined
                        }
                        role={
                          col.column.getCanSort() && enableSorting
                            ? "button"
                            : undefined
                        }
                        aria-label={
                          col.column.getCanSort() && enableSorting
                            ? `Sort by ${col.column.id}`
                            : undefined
                        }
                        style={{
                          cursor:
                            col.column.getCanSort() && enableSorting
                              ? "pointer"
                              : undefined,
                        }}
                        className={
                          col.column.getCanSort() && enableSorting
                            ? "flex items-center gap-2 hover:text-blue-600 transition-colors"
                            : ""
                        }
                      >
                        {flexRender(
                          col.column.columnDef.header,
                          col.getContext(),
                        )}
                        {enableSorting && col.column.getCanSort() && (
                          <span
                            className="inline-block text-gray-400"
                            aria-hidden="true"
                          >
                            {col.column.getIsSorted()
                              ? col.column.getIsSorted() === "asc"
                                ? "🔼"
                                : "🔽"
                              : "⇅"}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${row.getIsSelected() ? "bg-blue-50" : ""}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-3 px-4 align-top text-sm border-b border-gray-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {enablePagination && table.getPageCount() > 0 && (
        <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to first page"
            >
              {"<<"}
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              {"<"}
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              {">"}
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              {">>"}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            صفحة <strong>{table.getState().pagination.pageIndex + 1}</strong> من{" "}
            <strong>{table.getPageCount()}</strong> (
            {table.getFilteredRowModel().rows.length} صف)
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">صفوف لكل صفحة:</label>
            <select
              className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50, 100, 200, 300, 500, 1000, 2000].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
