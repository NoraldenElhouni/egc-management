import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type { Tag } from "../../../hooks/tasks/useAdminCatalog";

// D3's tag row — the company tag catalog (create/delete) lives in D11's
// FieldsAdminPage; this is the only place a tag actually gets attached to
// or removed from a real task (build plan §4.9's task_tags join table had
// no attach UI anywhere until now).
export default function TagPicker({
  allTags,
  tagIds,
  onToggle,
}: {
  allTags: Tag[];
  tagIds: string[];
  onToggle: (tagId: string, attached: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const attached = allTags.filter((t) => tagIds.includes(t.id));
  const available = allTags.filter((t) => !tagIds.includes(t.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attached.map((tag) => (
        <span
          key={tag.id}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: `${tag.color ?? "#6B7280"}1A`, color: tag.color ?? "#6B7280" }}
        >
          {tag.name}
          <button onClick={() => onToggle(tag.id, false)} className="hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600"
        >
          <Plus className="h-3 w-3" />
          وسم
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-1 w-40 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {available.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">
                {allTags.length === 0 ? "لا توجد وسوم بعد" : "كل الوسوم مضافة"}
              </div>
            ) : (
              available.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    onToggle(tag.id, true);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-right text-sm hover:bg-gray-50"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tag.color ?? "#6B7280" }} />
                  <span className="truncate">{tag.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
