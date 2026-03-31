import React, { useState } from "react";
import { SpecializationCategories, Services } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

type CategoryWithServices = SpecializationCategories & {
  services?: Services[];
};

type Props = {
  categories: CategoryWithServices[];
  onRefresh: () => void;
};

// ─── empty form shapes ──────────────────────────────────────────────────────
const EMPTY_CAT = { name: "" };
const EMPTY_SVC = { name: "", unit: "" };

const CategoriesList: React.FC<Props> = ({ categories, onRefresh }) => {
  // category edit
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);

  // service edit
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [svcForm, setSvcForm] = useState(EMPTY_SVC);

  // add service — keyed by category id
  const [addingInCatId, setAddingInCatId] = useState<string | null>(null);
  const [newSvcForm, setNewSvcForm] = useState(EMPTY_SVC);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── helpers ───────────────────────────────────────────────────────────────
  function extractMsg(e: unknown, fallback: string) {
    if (e instanceof Error) return e.message;
    if (typeof e === "object" && e !== null && "message" in e)
      return String((e as { message: unknown }).message);
    return fallback;
  }

  // ─── category CRUD ─────────────────────────────────────────────────────────
  const startEditCat = (cat: CategoryWithServices) => {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name });
    setEditingSvcId(null);
    setAddingInCatId(null);
    setError(null);
  };

  const cancelEditCat = () => {
    setEditingCatId(null);
    setCatForm(EMPTY_CAT);
    setError(null);
  };

  const handleUpdateCat = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("specialization_categories")
        .update({ name: catForm.name.trim() })
        .eq("id", id);
      if (error) throw error;
      cancelEditCat();
      onRefresh();
    } catch (e) {
      setError(extractMsg(e, "فشل تحديث التصنيف"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف التصنيف؟ سيتم حذف جميع خدماته أيضاً."))
      return;
    setError(null);
    try {
      // services with this category_id will be cascade-deleted or nullified
      // depending on your DB — nullify first to be safe
      await supabase
        .from("services")
        .update({ category_id: null })
        .eq("category_id", id);

      const { error } = await supabase
        .from("specialization_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (e) {
      setError(extractMsg(e, "فشل حذف التصنيف"));
    }
  };

  // ─── service CRUD ──────────────────────────────────────────────────────────
  const startEditSvc = (svc: Services) => {
    setEditingSvcId(svc.id);
    setSvcForm({ name: svc.name, unit: svc.unit || "" });
    setEditingCatId(null);
    setAddingInCatId(null);
    setError(null);
  };

  const cancelEditSvc = () => {
    setEditingSvcId(null);
    setSvcForm(EMPTY_SVC);
    setError(null);
  };

  const handleUpdateSvc = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: svcForm.name.trim(),
          unit: svcForm.unit.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      cancelEditSvc();
      onRefresh();
    } catch (e) {
      setError(extractMsg(e, "فشل تحديث الخدمة"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSvc = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الخدمة؟")) return;
    setError(null);
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (e) {
      setError(extractMsg(e, "فشل حذف الخدمة"));
    }
  };

  // ─── add service inside a category ────────────────────────────────────────
  const openAddSvc = (catId: string) => {
    setAddingInCatId(catId);
    setNewSvcForm(EMPTY_SVC);
    setEditingCatId(null);
    setEditingSvcId(null);
    setError(null);
  };

  const cancelAddSvc = () => {
    setAddingInCatId(null);
    setNewSvcForm(EMPTY_SVC);
    setError(null);
  };

  const handleAddSvc = async (catId: string, specializationId: string) => {
    if (!newSvcForm.name.trim()) {
      setError("اسم الخدمة مطلوب");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("services").insert({
        name: newSvcForm.name.trim(),
        unit: newSvcForm.unit.trim() || null,
        category_id: catId,
        specialization_id: specializationId,
      });
      if (error) throw error;
      cancelAddSvc();
      onRefresh();
    } catch (e) {
      setError(extractMsg(e, "فشل إضافة الخدمة"));
    } finally {
      setLoading(false);
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────
  if (!categories?.length) {
    return (
      <p className="text-gray-400 text-sm">
        لا توجد تصنيفات. أضف تصنيفاً لتبدأ.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {categories.map((cat) => (
        <div
          key={cat.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* ── Category header ── */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
            {editingCatId === cat.id ? (
              <>
                <input
                  value={catForm.name}
                  onChange={(e) => setCatForm({ name: e.target.value })}
                  className="flex-1 border px-2 py-1 text-sm rounded mr-2 focus:outline-none focus:border-gray-400"
                  placeholder="اسم التصنيف"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleUpdateCat(cat.id)
                  }
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCat(cat.id)}
                    disabled={loading}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    {loading ? "..." : "حفظ"}
                  </button>
                  <button
                    onClick={cancelEditCat}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-gray-800">
                  {cat.name}
                  <span className="mr-2 text-xs font-normal text-gray-400">
                    ({cat.services?.length ?? 0} خدمة)
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAddSvc(cat.id)}
                    className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700"
                  >
                    + خدمة
                  </button>
                  <button
                    onClick={() => startEditCat(cat)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteCat(cat.id)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Inline add-service form ── */}
          {addingInCatId === cat.id && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-2">
              <p className="text-xs font-medium text-gray-500">
                إضافة خدمة جديدة
              </p>
              <div className="flex gap-2">
                <input
                  value={newSvcForm.name}
                  onChange={(e) =>
                    setNewSvcForm({ ...newSvcForm, name: e.target.value })
                  }
                  placeholder="اسم الخدمة"
                  className="flex-1 border px-2 py-1.5 text-sm rounded focus:outline-none focus:border-gray-400"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleAddSvc(cat.id, cat.specialization_id)
                  }
                  autoFocus
                />
                <input
                  value={newSvcForm.unit}
                  onChange={(e) =>
                    setNewSvcForm({ ...newSvcForm, unit: e.target.value })
                  }
                  placeholder="الوحدة (اختياري)"
                  className="w-32 border px-2 py-1.5 text-sm rounded focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelAddSvc}
                  className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleAddSvc(cat.id, cat.specialization_id)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {loading ? "..." : "إضافة"}
                </button>
              </div>
            </div>
          )}

          {/* ── Nested services list ── */}
          {cat.services && cat.services.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {cat.services.map((svc) => (
                <li
                  key={svc.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  {editingSvcId === svc.id ? (
                    <>
                      <div className="flex gap-2 flex-1">
                        <input
                          value={svcForm.name}
                          onChange={(e) =>
                            setSvcForm({ ...svcForm, name: e.target.value })
                          }
                          className="flex-1 border px-2 py-1 text-sm rounded focus:outline-none focus:border-gray-400"
                          placeholder="اسم الخدمة"
                          autoFocus
                        />
                        <input
                          value={svcForm.unit}
                          onChange={(e) =>
                            setSvcForm({ ...svcForm, unit: e.target.value })
                          }
                          className="w-24 border px-2 py-1 text-sm rounded focus:outline-none focus:border-gray-400"
                          placeholder="الوحدة"
                        />
                      </div>
                      <div className="flex gap-2 mr-2">
                        <button
                          onClick={() => handleUpdateSvc(svc.id)}
                          disabled={loading}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          {loading ? "..." : "حفظ"}
                        </button>
                        <button
                          onClick={cancelEditSvc}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          إلغاء
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{svc.name}</span>
                        {svc.unit && (
                          <>
                            <span className="mx-1 text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                              {svc.unit}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditSvc(svc)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteSvc(svc.id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            // only show this when not already adding
            addingInCatId !== cat.id && (
              <p className="text-xs text-gray-400 px-4 py-3">
                لا توجد خدمات — اضغط "+ خدمة" لإضافة أولى خدمة.
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoriesList;
