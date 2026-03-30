import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { SpecializationCategories } from "../../types/global.type";

type Props = {
  specializationId: string;
  onCancel: () => void;
  onSuccess?: () => void; // ✅ notify parent to re-fetch
  categories?: SpecializationCategories[]; // ✅ optional: lets user pick a category
};

const AddServiceForm: React.FC<Props> = ({
  specializationId,
  onCancel,
  onSuccess,
  categories = [],
}) => {
  const [form, setForm] = useState({
    name: "",
    unit: "",
    category_id: "", // ✅ optional — service can belong to a category or be standalone
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("اسم الخدمة مطلوب");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("services").insert({
        name: form.name.trim(),
        unit: form.unit.trim() || null,
        specialization_id: specializationId,
        category_id: form.category_id || null, // ✅ null = standalone service
      });

      if (error) throw error;

      onSuccess?.(); // ✅ tell parent to refresh
      onCancel(); // ✅ close the form
    } catch (e: unknown) {
      let msg = "فشل إضافة الخدمة";
      if (e instanceof Error) msg = e.message;
      else if (typeof e === "object" && e !== null && "message" in e)
        msg = String((e as { message: unknown }).message);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
      {error && (
        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="اسم الخدمة"
          className="flex-1 border px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <input
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="الوحدة (اختياري)"
          className="w-32 border px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* ✅ Category picker — only shown if categories exist */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">
            التصنيف <span className="text-gray-400">(اختياري)</span>
          </label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">— بدون تصنيف —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:bg-gray-100"
        >
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "..." : "إضافة"}
        </button>
      </div>
    </div>
  );
};

export default AddServiceForm;
