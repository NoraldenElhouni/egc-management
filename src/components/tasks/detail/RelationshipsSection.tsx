import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type { Relationship } from "../../../hooks/tasks/useTaskDetail";
import type { Database } from "../../../lib/supabase";

type RelationshipType = Database["tasks"]["Enums"]["relationship_type"];

// clickup-task-ui's generic panel pattern groups these as "Blocking /
// Blocked by / Related / Duplicate of" chips, but in this app's actual
// schema (build plan §4.12 vs §4.13) blocking/blocked-by carry scheduling
// meaning and live in task_dependencies — that's DependenciesSection.tsx,
// not this table. task_relationships' own enum is relates_to /
// duplicate_of / reference, so the chip groups below use that instead of
// copying labels the schema can't represent here.
const TYPE_LABELS: Record<RelationshipType, string> = {
  relates_to: "متعلقة بـ",
  duplicate_of: "نسخة مكررة من",
  reference: "مرجع",
};

const TYPES: RelationshipType[] = ["relates_to", "duplicate_of", "reference"];

interface RelationshipsSectionProps {
  taskId: string;
  relationships: (Relationship & { relatedTitle: string })[];
  onAdd: (relatedTaskId: string, type: RelationshipType) => void;
  onRemove: (relationshipId: string) => void;
}

export default function RelationshipsSection({
  taskId,
  relationships,
  onAdd,
  onRemove,
}: RelationshipsSectionProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RelationshipType>("relates_to");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<number | null>(null);
  useClickOutside(ref, () => setOpen(false));

  const runSearch = (term: string) => {
    setSearch(term);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .schema("tasks")
        .from("tasks")
        .select("id, title")
        .eq("is_archived", false)
        .neq("id", taskId)
        .ilike("title", `%${term.trim()}%`)
        .limit(8);
      setResults(data ?? []);
    }, 300);
  };

  const byType = TYPES.map((t) => ({
    type: t,
    items: relationships.filter((r) => r.relationship_type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-2">
      {byType.map((group) => (
        <div key={group.type}>
          <div className="mb-1 text-xs font-semibold text-gray-500">
            {TYPE_LABELS[group.type]}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {r.relatedTitle}
                <button onClick={() => onRemove(r.id)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <Plus className="h-3.5 w-3.5" />
          ربط بمهمة أخرى
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RelationshipType)}
              className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              autoFocus
              value={search}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="ابحث عن مهمة..."
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
            />
            <div className="mt-1 max-h-40 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onAdd(r.id, type);
                    setOpen(false);
                    setSearch("");
                    setResults([]);
                  }}
                  className="block w-full truncate rounded px-2 py-1 text-right text-sm hover:bg-gray-50"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
