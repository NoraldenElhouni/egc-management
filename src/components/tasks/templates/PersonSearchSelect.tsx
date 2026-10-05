import { useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";

// A person picker with a search box, for long lists (every employee /
// assignable person) where a plain <select> means scrolling through
// everyone. Used by RoleGapsSection's "add to role" and "assign directly".

export interface PersonOption {
  id: string;
  name: string;
}

export default function PersonSearchSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: PersonOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.id === value);
  const term = search.trim().toLowerCase();
  const filtered = term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs outline-none hover:border-gray-300"
      >
        <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>{selected?.name ?? placeholder}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-full min-w-[200px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          <div className="mb-1 flex items-center gap-1.5 rounded-md border border-gray-200 px-1.5 py-1">
            <Search className="h-3 w-3 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم..."
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-gray-400">لا نتائج</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`block w-full truncate rounded px-2 py-1 text-right text-xs hover:bg-gray-50 ${
                    o.id === value ? "font-medium text-primary" : "text-gray-700"
                  }`}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
