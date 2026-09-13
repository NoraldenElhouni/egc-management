import { useRef, useState } from "react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type { CustomColumn, EmployeeLite } from "../../../hooks/tasks/useTaskBoard";
import type { Json } from "../../../lib/supabase";

// Generic cell for a board's attached custom fields (D2's "+"/"···"
// column editor). One cell type per field_definitions.type; formula and
// relationship are reserved/out of scope (build plan §4.11) so they
// render as a static placeholder rather than a half-built editor.

interface SelectOption {
  id: string;
  label_ar: string;
  color: string;
}

export default function CustomFieldCell({
  column,
  value,
  employeesById,
  allEmployees,
  onChange,
  align = "right",
}: {
  column: CustomColumn;
  value: Json | undefined;
  employeesById: Map<string, EmployeeLite>;
  allEmployees: EmployeeLite[];
  onChange: (value: Json) => void;
  /** See StatusCell's align prop — "left" for narrow contexts near the
   * screen's left edge (the D3 detail panel). */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  switch (column.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <input
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-gray-200 focus:border-gray-300 focus:bg-white focus:outline-none"
        />
      );

    case "long_text":
      return (
        <textarea
          defaultValue={typeof value === "string" ? value : ""}
          onBlur={(e) => onChange(e.target.value)}
          rows={1}
          className="w-full min-w-0 resize-none rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-gray-200 focus:border-gray-300 focus:bg-white focus:outline-none"
        />
      );

    case "number":
    case "currency":
      return (
        <input
          type="number"
          defaultValue={typeof value === "number" ? value : ""}
          onBlur={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-gray-200 focus:border-gray-300 focus:bg-white focus:outline-none"
        />
      );

    case "date":
      return (
        <input
          type="date"
          defaultValue={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-gray-200 focus:outline-none"
        />
      );

    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5"
        />
      );

    case "select": {
      const options = ((column.config as { options?: SelectOption[] } | null)?.options ?? []) as SelectOption[];
      const current = options.find((o) => o.id === value);
      return (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            style={current ? { background: `${current.color}1A`, color: current.color, border: `1px solid ${current.color}55` } : undefined}
            className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium text-gray-400"
          >
            {current?.label_ar ?? "—"}
          </button>
          {open && (
            <div className={`absolute ${align === "left" ? "left-0" : "right-0"} top-full z-30 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}>
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-sm hover:bg-gray-50"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.color }} />
                  <span className="truncate">{o.label_ar}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "multi_select": {
      const options = ((column.config as { options?: SelectOption[] } | null)?.options ?? []) as SelectOption[];
      const selectedIds: string[] = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (id: string) => {
        const next = selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id];
        onChange(next);
      };
      return (
        <div ref={ref} className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex max-w-full flex-wrap items-center gap-0.5 truncate text-xs text-gray-500">
            {selectedIds.length === 0
              ? "—"
              : selectedIds.map((id) => {
                  const o = options.find((opt) => opt.id === id);
                  return o ? (
                    <span key={id} className="rounded-full px-1.5 py-0.5" style={{ background: `${o.color}1A`, color: o.color }}>
                      {o.label_ar}
                    </span>
                  ) : null;
                })}
          </button>
          {open && (
            <div className={`absolute ${align === "left" ? "left-0" : "right-0"} top-full z-30 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}>
              {options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50">
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggle(o.id)} className="h-3.5 w-3.5" />
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.color }} />
                  <span className="truncate">{o.label_ar}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "user": {
      const employee = typeof value === "string" ? employeesById.get(value) : null;
      return (
        <div ref={ref} className="relative">
          <button onClick={() => setOpen((v) => !v)} className="truncate text-xs text-gray-600">
            {employee ? `${employee.first_name} ${employee.last_name ?? ""}` : "—"}
          </button>
          {open && (
            <div className={`absolute ${align === "left" ? "left-0" : "right-0"} top-full z-30 mt-1 w-40 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}>
              {allEmployees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-right text-sm hover:bg-gray-50"
                >
                  {e.first_name} {e.last_name ?? ""}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return <span className="text-xs text-gray-300">—</span>;
  }
}
