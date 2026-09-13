import { useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import { useLinkableRecords, RECORD_TYPE_LABELS, type LinkRecordType } from "../../../hooks/tasks/useLinkedRecord";
import type { Database } from "../../../lib/supabase";

type LinkMode = Database["tasks"]["Enums"]["link_mode"];

const LINK_MODE_LABELS: Record<LinkMode, string> = {
  produces: "تُنتج بهذه المهمة",
  references: "مرجع فقط",
};

// The "+" that was missing next to السجل المرتبط — task_links had no
// creation path anywhere (build plan §4.14's whole point was closing the
// loop between a task and the ERP record it becomes). Scoped to the
// task's own project since every linkable record type carries project_id.
export default function LinkRecordPicker({
  projectId,
  onAdd,
}: {
  projectId: string | null;
  onAdd: (input: { recordType: LinkRecordType; recordId: string; linkMode: LinkMode }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState<LinkRecordType>("shop_order");
  const [linkMode, setLinkMode] = useState<LinkMode>("references");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const records = useLinkableRecords(recordType, projectId);
  const filtered = records.filter((r) => !search.trim() || r.label.toLowerCase().includes(search.toLowerCase()));

  if (!projectId) {
    return <p className="text-xs text-gray-400">هذه اللوحة غير مرتبطة بمشروع، لا يمكن ربط سجلات ERP بمهامها.</p>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-2.5 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <Plus className="h-3.5 w-3.5" />
        ربط بسجل
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="space-y-1.5 border-b border-gray-100 p-2">
            <select
              value={recordType}
              onChange={(e) => {
                setRecordType(e.target.value as LinkRecordType);
                setSearch("");
              }}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            >
              {(Object.keys(RECORD_TYPE_LABELS) as LinkRecordType[]).map((t) => (
                <option key={t} value={t}>
                  {RECORD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={linkMode}
              onChange={(e) => setLinkMode(e.target.value as LinkMode)}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            >
              {(Object.keys(LINK_MODE_LABELS) as LinkMode[]).map((m) => (
                <option key={m} value={m}>
                  {LINK_MODE_LABELS[m]}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 rounded border border-gray-200 px-1.5 py-1">
              <Search className="h-3 w-3 shrink-0 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full min-w-0 bg-transparent text-xs outline-none"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">لا توجد سجلات مطابقة في هذا المشروع</div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onAdd({ recordType, recordId: r.id, linkMode });
                    setOpen(false);
                    setSearch("");
                  }}
                  className="block w-full truncate px-3 py-1.5 text-right text-sm hover:bg-gray-50"
                >
                  {r.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
