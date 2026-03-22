import React, { useState } from "react";
import { Services } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  services: Services[];
  onRefresh: () => void;
};

const ServicesList: React.FC<Props> = ({ services, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", unit: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (service: Services) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      unit: service.unit || "",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", unit: "" });
    setError(null);
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: form.name.trim(),
          unit: form.unit.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;

      cancelEdit();
      onRefresh();
    } catch (e: unknown) {
      let msg = "فشل تحديث الخدمة";

      if (e instanceof Error) msg = e.message;
      else if (typeof e === "object" && e !== null && "message" in e) {
        msg = String((e as { message: unknown }).message);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);

    if (!confirm("هل أنت متأكد من الحذف؟")) return;

    try {
      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) throw error;

      onRefresh();
    } catch (e: unknown) {
      let msg = "فشل حذف الخدمة";

      if (e instanceof Error) msg = e.message;
      else if (typeof e === "object" && e !== null && "message" in e) {
        msg = String((e as { message: unknown }).message);
      }

      setError(msg);
    }
  };

  if (!services?.length) {
    return <p className="text-gray-400 text-sm">لا توجد خدمات</p>;
  }

  return (
    <div className="space-y-3">
      {/* 🔴 Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {services.map((service) => (
        <div
          key={service.id}
          className="border-b pb-2 flex items-center justify-between"
        >
          {editingId === service.id ? (
            <>
              {/* Edit Mode */}
              <div className="flex gap-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border px-2 py-1 text-sm rounded"
                  placeholder="اسم الخدمة"
                />

                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="border px-2 py-1 text-sm rounded"
                  placeholder="الوحدة"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(service.id)}
                  disabled={loading}
                  className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded"
                >
                  {loading ? "..." : "حفظ"}
                </button>

                <button
                  onClick={cancelEdit}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                >
                  إلغاء
                </button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="text-sm">
                <span className="font-medium text-gray-800">
                  {service.name}
                </span>
                <span className="mx-1 text-gray-400">:</span>
                <span className="text-gray-600">{service.unit ?? "-"}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(service)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
                >
                  تعديل
                </button>

                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded"
                >
                  حذف
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServicesList;
