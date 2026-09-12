import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAdminCatalog, type FieldType } from "../../../hooks/tasks/useAdminCatalog";

// D11 — Admin: fields, tags, task types (build plan Part 7). See
// useAdminCatalog.ts's header for why deletes confirm with a usage
// count first (field_definitions/tags cascade-delete their usages).

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

type Tab = "fields" | "tags" | "task_types";
const TABS: { key: Tab; label: string }[] = [
  { key: "fields", label: "الحقول" },
  { key: "tags", label: "الوسوم" },
  { key: "task_types", label: "أنواع المهام" },
];

export default function FieldsAdminPage() {
  const [tab, setTab] = useState<Tab>("fields");
  const catalog = useAdminCatalog();
  const { data, loading, error } = catalog;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="flex h-full items-center justify-center text-sm text-red-500">تعذّر تحميل البيانات</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir="rtl">
      <div className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">الحقول والوسوم وأنواع المهام</h1>
      </div>

      <div className="flex gap-1 border-b border-gray-100 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm ${
              tab === t.key ? "border-primary font-medium text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {tab === "fields" && <FieldsTab catalog={catalog} />}
        {tab === "tags" && <TagsTab catalog={catalog} />}
        {tab === "task_types" && <TaskTypesTab catalog={catalog} />}
      </div>
    </div>
  );
}

function FieldsTab({ catalog }: { catalog: ReturnType<typeof useAdminCatalog> }) {
  const { data, createField, deleteField } = catalog;
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("text");
  if (!data) return null;

  const handleCreate = async () => {
    if (!nameAr.trim() || !name.trim()) return;
    await createField({ name: name.trim(), name_ar: nameAr.trim(), type, config: {} });
    setNameAr("");
    setName("");
  };

  const handleDelete = (fieldId: string, label: string, boardCount: number) => {
    const warning = boardCount > 0 ? `هذا الحقل مستخدم في ${boardCount} لوحة. حذفه سيحذف قيمه من كل مهمة.` : "";
    if (confirm(`حذف حقل "${label}"؟ ${warning}`)) deleteField(fieldId);
  };

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <input
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder="اسم الحقل (عربي)"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name (English)"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none">
          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
            <option key={t} value={t}>
              {FIELD_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button onClick={handleCreate} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white">
          <Plus className="h-3.5 w-3.5" />
          إنشاء
        </button>
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {data.fields.length === 0 ? (
          <div className="p-3 text-sm text-gray-400">لا توجد حقول بعد</div>
        ) : (
          data.fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-gray-800">{f.name_ar}</span>
                <span className="ms-2 text-xs text-gray-400">{FIELD_TYPE_LABELS[f.type]}</span>
                {f.is_system && <span className="ms-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">نظام</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">مستخدم في {f.boardCount} لوحة</span>
                {!f.is_system && (
                  <button onClick={() => handleDelete(f.id, f.name_ar, f.boardCount)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TagsTab({ catalog }: { catalog: ReturnType<typeof useAdminCatalog> }) {
  const { data, createTag, deleteTag } = catalog;
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  if (!data) return null;

  const handleDelete = (tagId: string, label: string, taskCount: number) => {
    const warning = taskCount > 0 ? `هذا الوسم مستخدم على ${taskCount} مهمة. حذفه سيزيله منها.` : "";
    if (confirm(`حذف وسم "${label}"؟ ${warning}`)) deleteTag(tagId);
  };

  return (
    <div className="max-w-lg space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 shrink-0 rounded border-0" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الوسم"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            createTag({ name: name.trim(), color });
            setName("");
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          إنشاء
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.tags.length === 0 ? (
          <div className="text-sm text-gray-400">لا توجد وسوم بعد</div>
        ) : (
          data.tags.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: `${t.color ?? "#6B7280"}1A`, color: t.color ?? "#6B7280", border: `1px solid ${t.color ?? "#6B7280"}55` }}
            >
              {t.name} <span className="text-gray-400">({t.taskCount})</span>
              <button onClick={() => handleDelete(t.id, t.name, t.taskCount)} className="hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function TaskTypesTab({ catalog }: { catalog: ReturnType<typeof useAdminCatalog> }) {
  const { data, createTaskType, updateTaskType, deleteTaskType } = catalog;
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  if (!data) return null;

  return (
    <div className="max-w-lg space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 shrink-0 rounded border-0" />
        <input
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder="اسم النوع (عربي)"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type name (English)"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <button
          onClick={() => {
            if (!nameAr.trim() || !name.trim()) return;
            createTaskType({ name: name.trim(), name_ar: nameAr.trim(), color });
            setNameAr("");
            setName("");
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          إنشاء
        </button>
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {data.taskTypes.map((tt) => (
          <div key={tt.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <input
              type="color"
              defaultValue={tt.color ?? "#9CA3AF"}
              onBlur={(e) => updateTaskType({ id: tt.id, patch: { color: e.target.value } })}
              disabled={tt.is_system}
              className="h-6 w-6 shrink-0 rounded border-0 disabled:opacity-50"
            />
            <input
              defaultValue={tt.name_ar}
              disabled={tt.is_system}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== tt.name_ar) updateTaskType({ id: tt.id, patch: { name_ar: value } });
              }}
              className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 disabled:text-gray-400 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
            />
            {tt.is_system ? (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">نظام</span>
            ) : (
              <button onClick={() => confirm(`حذف نوع "${tt.name_ar}"؟`) && deleteTaskType(tt.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
