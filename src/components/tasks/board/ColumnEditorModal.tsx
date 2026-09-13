import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { useAllFieldDefinitions, type FieldType } from "../../../hooks/tasks/useTaskBoard";

// D2's "+" column editor — clickup-task-ui skill: "offer 'use existing
// field' as well as 'create new field'" since fields are define-once,
// attach-many (build plan §4.11). Option-list editing for select/
// multi_select stays in D11's field manager, not duplicated here.

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "نص",
  long_text: "نص طويل",
  number: "رقم",
  currency: "عملة",
  date: "تاريخ",
  select: "اختيار واحد",
  multi_select: "اختيار متعدد",
  user: "مستخدم",
  checkbox: "مربع اختيار",
  url: "رابط",
  email: "بريد إلكتروني",
  phone: "هاتف",
  formula: "معادلة",
  relationship: "علاقة",
};

export default function ColumnEditorModal({
  attachedFieldIds,
  onAttach,
  onCreate,
  onClose,
}: {
  attachedFieldIds: Set<string>;
  onAttach: (fieldDefinitionId: string) => void;
  onCreate: (input: { name: string; name_ar: string; type: FieldType; config: object }) => void;
  onClose: () => void;
}) {
  const allFields = useAllFieldDefinitions();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("text");

  const available = allFields.filter((f) => !attachedFieldIds.has(f.id));
  const filtered = available.filter((f) => !search.trim() || f.name_ar.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!nameAr.trim() || !name.trim()) return;
    onCreate({ name: name.trim(), name_ar: nameAr.trim(), type, config: {} });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl">
      <div className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">إضافة عمود</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100 px-4 pt-2">
          <button
            onClick={() => setMode("existing")}
            className={`border-b-2 px-2 py-1.5 text-sm ${mode === "existing" ? "border-primary font-medium text-primary" : "border-transparent text-gray-500"}`}
          >
            حقل موجود
          </button>
          <button
            onClick={() => setMode("new")}
            className={`border-b-2 px-2 py-1.5 text-sm ${mode === "new" ? "border-primary font-medium text-primary" : "border-transparent text-gray-500"}`}
          >
            حقل جديد
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {mode === "existing" ? (
            <>
              <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن حقل..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">لا توجد حقول متاحة</div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onAttach(f.id)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-right text-sm hover:bg-gray-50"
                    >
                      <span>{f.name_ar}</span>
                      <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[f.type]}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم الحقل (عربي)"
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Field name (English)"
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
              />
              <select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                إنشاء وإضافة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
