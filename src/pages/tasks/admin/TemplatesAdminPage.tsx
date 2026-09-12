import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, FileStack } from "lucide-react";
import { useTemplatesAdmin } from "../../../hooks/tasks/useTemplatesAdmin";

// D8 — Template builder admin, list screen (build plan Part 7).

export default function TemplatesAdminPage() {
  const navigate = useNavigate();
  const { data, loading, error, createTemplate, creating, deleteTemplate } = useTemplatesAdmin();
  const [showNew, setShowNew] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!nameAr.trim() || !name.trim()) return;
    const id = await createTemplate({ name_ar: nameAr.trim(), name: name.trim(), template_scope: "board", applies_to: null });
    setShowNew(false);
    setNameAr("");
    setName("");
    navigate(`/tasks/admin/templates/${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-sm text-red-500">تعذّر تحميل القوالب</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">القوالب</h1>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          قالب جديد
        </button>
      </div>

      {showNew && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="اسم القالب (عربي)"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (English)"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            إنشاء
          </button>
        </div>
      )}

      {!data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          لا توجد قوالب بعد
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/tasks/admin/templates/${t.id}`)}
              className="group flex cursor-pointer flex-col gap-1 rounded-lg border border-gray-200 p-3 hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                  <FileStack className="h-3.5 w-3.5 text-gray-400" />
                  {t.name_ar}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`حذف قالب "${t.name_ar}"؟`)) deleteTemplate(t.id);
                  }}
                  className="text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-xs text-gray-400">
                {t.taskCount} مهمة · {t.template_scope === "board" ? "لوحة" : "مهمة"}
                {t.applies_to && ` · ${t.applies_to}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
