import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { expenses as Expense } from "../../../types/global.type";

type Props = {
  onAdded: (expense: Expense) => void;
};

const AddExpenseForm: React.FC<Props> = ({ onAdded }) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      setError(null);

      const { data, error } = await supabase
        .from("expenses")
        .insert([{ name: trimmed }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setError("هذا المصروف موجود مسبقًا");
          return;
        }
        throw error;
      }

      // ✅ push directly into table data
      onAdded(data);
      setName("");
    } catch (e) {
      console.error("Error adding expense:", e);
      setError("فشل إضافة المصروف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold mb-2">إضافة مصروف</h2>

      {error && (
        <div className="mb-2 rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم المصروف"
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          disabled={saving || !name.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "..." : "إضافة"}
        </button>
      </form>
    </div>
  );
};

export default AddExpenseForm;
