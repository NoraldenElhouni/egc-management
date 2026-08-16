// pages/settings/banks/BanksPage.tsx
import React, { useMemo, useState } from "react";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { Landmark, Plus, Search, Pencil, Trash2, X, Check } from "lucide-react";
import { useBanks } from "../../../hooks/useBanks";

const BanksPage = () => {
  const { banks, loading, error, addNew, edit, remove } = useBanks();

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const count = useMemo(() => banks.length, [banks]);

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await addNew(trimmed);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    setSavingEdit(true);
    try {
      await edit(editingId, trimmed);
      cancelEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "فشل في حذف البنك");
    } finally {
      setDeleting(false);
    }
  };

  const filteredBanks = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return banks;
    return banks.filter((b) => b.name.includes(trimmed));
  }, [banks, query]);

  if (loading) return <LoadingPage label="جاري تحميل البنوك..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل البيانات" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  البنوك
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  إدارة قائمة البنوك
                </p>
              </div>
            </div>

            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {count}
            </span>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في البنوك..."
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              إضافة بنك
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: مصرف الجمهورية"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {adding ? "..." : "إضافة"}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {filteredBanks.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                لا توجد بنوك
              </p>
              <p className="text-xs text-gray-500 mt-1">
                جرّب إضافة بنك جديد من الأعلى
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredBanks.map((b) => {
                const isEditing = editingId === b.id;

                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-4 h-4 text-indigo-600" />
                      </div>

                      {!isEditing ? (
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {b.name}
                        </span>
                      ) : (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full max-w-[320px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                          autoFocus
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(b.id, b.name)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ id: b.id, name: b.name })
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 transition"
                            disabled={savingEdit}
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={
                              savingEdit ||
                              !editName.trim() ||
                              editName.trim() === b.name
                            }
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 active:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            title="حفظ"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف البنك"
        message={
          deleteTarget
            ? `هل أنت متأكد من حذف "${deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmVariant="error"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />

      {deleteError && (
        <div className="max-w-4xl mx-auto mt-3">
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {deleteError}
          </p>
        </div>
      )}
    </div>
  );
};

export default BanksPage;
