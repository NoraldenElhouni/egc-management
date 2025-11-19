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
} from "@tanstack/react-table";

// Generic reusable table component
// Props:
// - data: array of row objects
// - columns: TanStack ColumnDef[] defined by the consumer
// - initialSorting: optional initial sorting
// - pageSize: initial page size for pagination
// - enableSorting / enablePagination / enableFiltering / enableRowSelection: booleans for enabling features
// - onRowClick: optional click handler
// - onRowSelectionChange: optional selection change handler
// - showGlobalFilter: show search box for filtering all columns

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
};

export default function GenericTable<TData extends object>({
  data,
  columns,
  initialSorting = [],
  pageSize = 10,
  enableSorting = true,
  enablePagination = true,
  enableFiltering = false,
  enableRowSelection = false,
  showGlobalFilter = false,
  onRowClick,
  onRowSelectionChange,
  className = "",
  emptyMessage = "لا توجد بيانات لعرضها.",
}: GenericTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
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
      pagination: {
        pageSize: pageSize,
      },
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
      {/* Global Filter */}
      {showGlobalFilter && enableFiltering && (
        <div className="mb-3">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Selection Info */}
      {enableRowSelection && Object.keys(rowSelection).length > 0 && (
        <div className="mb-2 text-sm text-blue-600">
          {Object.keys(rowSelection).length} row(s) selected
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto border rounded">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="text-left py-3 px-4 font-semibold text-sm select-none border-b border-gray-200"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          onClick:
                            header.column.getCanSort() && enableSorting
                              ? header.column.getToggleSortingHandler()
                              : undefined,
                          role:
                            header.column.getCanSort() && enableSorting
                              ? "button"
                              : undefined,
                          "aria-label":
                            header.column.getCanSort() && enableSorting
                              ? `Sort by ${header.column.id}`
                              : undefined,
                          style: {
                            cursor:
                              header.column.getCanSort() && enableSorting
                                ? "pointer"
                                : undefined,
                          },
                          className:
                            header.column.getCanSort() && enableSorting
                              ? "flex items-center gap-2 hover:text-blue-600 transition-colors"
                              : "",
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {enableSorting && header.column.getCanSort() && (
                          <span
                            className="inline-block text-gray-400"
                            aria-hidden="true"
                          >
                            {header.column.getIsSorted()
                              ? header.column.getIsSorted() === "asc"
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
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong> (
            {table.getFilteredRowModel().rows.length} total rows)
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50, 100].map((size) => (
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
