import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  specializationId: string;
  onCancel: () => void;
  onSuccess?: () => void; // ✅ notify parent to re-fetch
};

const AddCategoryForm: React.FC<Props> = ({
  specializationId,
  onCancel,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("اسم التصنيف مطلوب");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("specialization_categories")
        .insert({
          name: name.trim(),
          specialization_id: specializationId,
        });

      if (error) throw error;

      onSuccess?.(); // ✅ tell parent to refresh
      onCancel(); // ✅ close the form
    } catch (e: unknown) {
      let msg = "فشل إضافة التصنيف";
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

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اسم التصنيف"
        className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-400"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />

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

export default AddCategoryForm;
