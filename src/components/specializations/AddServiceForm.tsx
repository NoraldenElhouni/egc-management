import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  specializationId: string;
  onSuccess: () => void; // refresh list
  onCancel: () => void;
};

const AddServiceForm: React.FC<Props> = ({
  specializationId,
  onSuccess,
  onCancel,
}) => {
  const [form, setForm] = useState({
    name: "",
    unit: "",
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
      });

      if (error) throw error;

      // reset
      setForm({ name: "", unit: "" });

      onSuccess(); // reload parent
    } catch (e: unknown) {
      let msg = "فشل إضافة الخدمة";

      if (e instanceof Error) msg = e.message;
      else if (typeof e === "object" && e !== null && "message" in e) {
        msg = String((e as { message: unknown }).message);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Inputs */}
      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="اسم الخدمة"
          className="w-full border px-3 py-2 text-sm rounded"
        />

        <input
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="الوحدة"
          className="w-full border px-3 py-2 text-sm rounded"
        />
      </div>

      {/* Actions */}
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
