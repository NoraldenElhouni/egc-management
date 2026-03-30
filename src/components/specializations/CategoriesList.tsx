import React, { useState } from "react";
import { SpecializationCategories, Services } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

// ✅ Categories fetched with services(*) in the hook, so we extend the type here
type CategoryWithServices = SpecializationCategories & {
  services?: Services[];
};

type Props = {
  categories: CategoryWithServices[];
  onRefresh: () => void;
};

const CategoriesList: React.FC<Props> = ({ categories, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", unit: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Category edit ────────────────────────────────────────────────────────
  const startEditCategory = (cat: CategoryWithServices) => {
    setEditingId(cat.id);
    setCategoryForm({ name: cat.name });
    setEditingServiceId(null);
    setError(null);
  };

  const cancelEditCategory = () => {
    setEditingId(null);
    setCategoryForm({ name: "" });
    setError(null);
  };

  const handleUpdateCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("specialization_categories")
        .update({ name: categoryForm.name.trim() })
        .eq("id", id);
      if (error) throw error;
      cancelEditCategory();
      onRefresh();
    } catch (e: unknown) {
      setError(extractMessage(e, "فشل تحديث التصنيف"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف التصنيف؟ سيتم إلغاء ربط الخدمات به."))
      return;
    setError(null);
    try {
      const { error } = await supabase
        .from("specialization_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (e: unknown) {
      setError(extractMessage(e, "فشل حذف التصنيف"));
    }
  };

  // ─── Service edit (inside a category) ────────────────────────────────────
  const startEditService = (svc: Services) => {
    setEditingServiceId(svc.id);
    setServiceForm({ name: svc.name, unit: svc.unit || "" });
    setEditingId(null);
    setError(null);
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setServiceForm({ name: "", unit: "" });
    setError(null);
  };

  const handleUpdateService = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: serviceForm.name.trim(),
          unit: serviceForm.unit.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      cancelEditService();
      onRefresh();
    } catch (e: unknown) {
      setError(extractMessage(e, "فشل تحديث الخدمة"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الخدمة؟")) return;
    setError(null);
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (e: unknown) {
      setError(extractMessage(e, "فشل حذف الخدمة"));
    }
  };

  if (!categories?.length) {
    return <p className="text-gray-400 text-sm">لا توجد تصنيفات</p>;
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
          {/* ── Category Header ── */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
            {editingId === cat.id ? (
              <>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  className="border px-2 py-1 text-sm rounded flex-1 mr-2"
                  placeholder="اسم التصنيف"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCategory(cat.id)}
                    disabled={loading}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                  >
                    {loading ? "..." : "حفظ"}
                  </button>
                  <button
                    onClick={cancelEditCategory}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
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
                    onClick={() => startEditCategory(cat)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded"
                  >
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Nested Services ── */}
          {cat.services && cat.services.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {cat.services.map((svc) => (
                <li
                  key={svc.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  {editingServiceId === svc.id ? (
                    <>
                      <div className="flex gap-2 flex-1">
                        <input
                          value={serviceForm.name}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              name: e.target.value,
                            })
                          }
                          className="border px-2 py-1 text-sm rounded flex-1"
                          placeholder="اسم الخدمة"
                        />
                        <input
                          value={serviceForm.unit}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              unit: e.target.value,
                            })
                          }
                          className="border px-2 py-1 text-sm rounded w-24"
                          placeholder="الوحدة"
                        />
                      </div>
                      <div className="flex gap-2 mr-2">
                        <button
                          onClick={() => handleUpdateService(svc.id)}
                          disabled={loading}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                        >
                          {loading ? "..." : "حفظ"}
                        </button>
                        <button
                          onClick={cancelEditService}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
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
                            <span className="mx-1 text-gray-400">·</span>
                            <span className="text-gray-500 text-xs">
                              {svc.unit}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditService(svc)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteService(svc.id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded"
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
            <p className="text-xs text-gray-400 px-4 py-2">
              لا توجد خدمات في هذا التصنيف
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── helper ──────────────────────────────────────────────────────────────────
function extractMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e)
    return String((e as { message: unknown }).message);
  return fallback;
}

export default CategoriesList;
