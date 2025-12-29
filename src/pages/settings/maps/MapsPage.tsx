// pages/MapsPage.tsx
import React, { useMemo, useState } from "react";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import { Map, Plus, Search, Pencil, X, Check } from "lucide-react";
import { useMaps } from "../../../hooks/useMaps";

const MapsPage = () => {
  const { maps, loading, error, addNew, edit } = useMaps();

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const count = useMemo(() => maps.length, [maps]);

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

  const filteredMaps = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return maps;
    return maps.filter((m) => m.name.includes(trimmed));
  }, [maps, query]);

  if (loading) return <LoadingPage label="جاري تحميل أنواع الخرائط..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل البيانات" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Map className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  أنواع الخرائط
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  إدارة وتصنيف أنواع الخرائط الهندسية
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
              placeholder="ابحث في أنواع الخرائط..."
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
              إضافة نوع خريطة
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: خرائط معمارية"
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
          {filteredMaps.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                لا توجد أنواع خرائط
              </p>
              <p className="text-xs text-gray-500 mt-1">
                جرّب إضافة نوع جديد من الأعلى
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredMaps.map((m) => {
                const isEditing = editingId === m.id;

                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Map className="w-4 h-4 text-indigo-600" />
                      </div>

                      {!isEditing ? (
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {m.name}
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
                        <button
                          type="button"
                          onClick={() => startEdit(m.id, m.name)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 transition"
                        >
                          <Pencil className="w-4 h-4" />
                          تعديل
                        </button>
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
                              editName.trim() === m.name
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
    </div>
  );
};

export default MapsPage;
