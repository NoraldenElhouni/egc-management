import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, FileStack, Pencil } from "lucide-react";
import { useTemplatesAdmin } from "../../../hooks/tasks/useTemplatesAdmin";
import { AdminPageSkeleton } from "../../../components/tasks/TasksSkeletons";

// D8 — Templates admin, list screen (build plan Part 7). Each template is
// a board (boards.is_template); clicking one opens it on the normal board
// screen, where it's edited exactly like a board.

export default function TemplatesAdminPage() {
  const navigate = useNavigate();
  const { data, loading, error, createTemplate, creating, renameTemplate, deleteTemplate } = useTemplatesAdmin();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    const id = await createTemplate(name.trim());
    setShowNew(false);
    setName("");
    navigate(`/tasks/board/${id}`);
  };

  const commitRename = async () => {
    if (renamingId && renameDraft.trim()) await renameTemplate({ id: renamingId, name: renameDraft.trim() });
    setRenamingId(null);
  };

  if (loading) {
    return <AdminPageSkeleton />;
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
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="اسم القالب"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
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
              onClick={() => renamingId !== t.id && navigate(`/tasks/board/${t.id}`)}
              className="group flex cursor-pointer flex-col gap-1 rounded-lg border border-gray-200 p-3 hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                {renamingId === t.id ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 rounded-md border border-gray-200 px-2 py-0.5 text-sm outline-none focus:border-primary"
                  />
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <FileStack className="h-3.5 w-3.5 text-gray-400" />
                    {t.name}
                  </span>
                )}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(t.id);
                      setRenameDraft(t.name);
                    }}
                    className="text-gray-300 hover:text-gray-600"
                    title="إعادة تسمية"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`حذف قالب "${t.name}"؟`)) deleteTemplate(t.id);
                    }}
                    className="text-gray-300 hover:text-red-500"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">{t.taskCount} مهمة</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
