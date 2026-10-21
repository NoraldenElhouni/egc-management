// pages/settings/units/UnitsPage.tsx
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Ruler, Search, X } from "lucide-react";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import { useUnits } from "../../../hooks/agreements/useAgreements";
import { useUnitsAdmin } from "../../../hooks/useUnitsAdmin";
import type { Unit } from "../../../types/agreements.types";

// Units of measurement for agreement items (lookups.units). Same look as
// the banks page. A unit is never deleted — items point at it — so the
// switch here hides it from the item pickers instead.
const UnitsPage = () => {
  const { data: units = [], isLoading, error } = useUnits(false);
  const { add, update } = useUnitsAdmin();

  const [newName, setNewName] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    return q ? units.filter((u) => u.name.includes(q)) : units;
  }, [units, query]);

  const onError = (e: unknown) => setActionError(e instanceof Error ? e.message : "حدث خطأ");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setActionError(null);
    const nextOrder = Math.max(0, ...units.map((u) => u.sort_order)) + 1;
    add.mutate({ name, sortOrder: nextOrder }, { onSuccess: () => setNewName(""), onError });
  };

  const saveEdit = (u: Unit) => {
    const name = editName.trim();
    if (!name || name === u.name) return setEditingId(null);
    setActionError(null);
    update.mutate({ id: u.id, name }, { onSuccess: () => setEditingId(null), onError });
  };

  // Swap places with the neighbour above / below.
  const move = (index: number, dir: -1 | 1) => {
    const a = units[index];
    const b = units[index + dir];
    if (!a || !b) return;
    setActionError(null);
    update.mutate({ id: a.id, sort_order: b.sort_order }, { onError });
    update.mutate({ id: b.id, sort_order: a.sort_order }, { onError });
  };

  if (isLoading) return <LoadingPage label="جاري تحميل وحدات القياس..." />;
  if (error) return <ErrorPage error={(error as Error).message} label="خطأ في تحميل البيانات" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">وحدات القياس</h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  الوحدات المتاحة لبنود الاتفاقيات (م²، م³، مقطوعية…)
                </p>
              </div>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {units.length}
            </span>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في الوحدات..."
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">إضافة وحدة</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: م²"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              disabled={add.isPending}
            />
            <button
              type="submit"
              disabled={add.isPending || !newName.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {add.isPending ? "..." : "إضافة"}
            </button>
          </div>
        </form>

        {actionError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{actionError}</p>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">لا توجد وحدات</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((u) => {
                const index = units.findIndex((x) => x.id === u.id);
                const isEditing = editingId === u.id;
                return (
                  <li
                    key={u.id}
                    className={`flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition hover:bg-gray-50 ${
                      u.is_active ? "" : "opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          title="أعلى"
                          disabled={index <= 0 || !!query.trim()}
                          onClick={() => move(index, -1)}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="أسفل"
                          disabled={index >= units.length - 1 || !!query.trim()}
                          onClick={() => move(index, 1)}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full max-w-[240px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900 truncate">{u.name}</span>
                      )}
                      {!u.is_active && <span className="text-xs text-gray-500">(مخفية)</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 transition"
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(u)}
                            disabled={update.isPending || !editName.trim()}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition disabled:opacity-60"
                            title="حفظ"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(u.id);
                              setEditName(u.name);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => update.mutate({ id: u.id, is_active: !u.is_active }, { onError })}
                            className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium transition border ${
                              u.is_active
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {u.is_active ? "إخفاء" : "إظهار"}
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

export default UnitsPage;
