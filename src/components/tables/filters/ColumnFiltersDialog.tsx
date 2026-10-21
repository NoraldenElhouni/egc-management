import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";

export type ColumnFilterDef = {
  /** Column id in the table; the column needs filterFn "equalsString". */
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
};

/**
 * The "فلاتر" button at the end of the search bar + its dialog, for any
 * table whose filters are plain "equals one of these" selects. Same look
 * as ContractorPaymentsFiltersDialog, driven by a list instead of fixed
 * columns. Used by the agreements and penalties tables.
 */
export default function ColumnFiltersDialog<TData>({
  table,
  filters,
}: {
  table: Table<TData>;
  filters: ColumnFilterDef[];
}) {
  const [open, setOpen] = useState(false);
  const activeCount = table.getState().columnFilters.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        فلاتر
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filters.map((f) => (
              <SearchableSelectField
                key={f.columnId}
                id={`filter-${f.columnId}`}
                label={f.label}
                placeholder="الكل"
                options={[{ value: "", label: "الكل" }, ...f.options]}
                value={(table.getColumn(f.columnId)?.getFilterValue() as string | undefined) ?? ""}
                onChange={(v) => table.getColumn(f.columnId)?.setFilterValue(v || undefined)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => table.resetColumnFilters()}
              disabled={activeCount === 0}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              مسح الفلاتر
            </button>
            <Button type="button" variant="primary" size="sm" onClick={() => setOpen(false)}>
              تم
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** Distinct, sorted, non-empty values as select options. */
export function optionsOf(values: (string | null | undefined)[], label?: (v: string) => string) {
  return Array.from(new Set(values.filter((v): v is string => !!v)))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((v) => ({ value: v, label: label ? label(v) : v }));
}
