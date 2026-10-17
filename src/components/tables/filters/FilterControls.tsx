import { SlidersHorizontal } from "lucide-react";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";

// Pieces shared by the filter dialogs that open from the end of a table's
// search row (ActivityLogFiltersDialog, TaskLogFiltersDialog).

export type FilterOption = { value: string; label: string };

const labelClass = "text-xs font-medium text-gray-500";
const inputClass =
  "px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const ALL: FilterOption = { value: "", label: "الكل" };

/** "فلاتر" button with a red badge counting the active filters. */
export function FiltersButton({ activeCount, onClick }: { activeCount: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  );
}

/** A searchable select whose first option, "الكل", means no filter. */
export function FilterSelect({
  id,
  label,
  options,
  selected,
  onSelect,
  loading,
}: {
  id: string;
  label: string;
  options: FilterOption[];
  selected: string;
  onSelect: (v: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <SearchableSelectField
        id={id}
        hideLabel
        placeholder="الكل"
        options={[ALL, ...options]}
        value={selected}
        onChange={onSelect}
        loading={loading}
      />
    </div>
  );
}

/** <input type="date">; the value is yyyy-mm-dd or "". */
export function FilterDate({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}
