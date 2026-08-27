import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import Button from "../ui/Button";

export interface EditableInfoField {
  key: string;
  label: string;
  type?: "text" | "tel" | "date" | "select";
  options?: { value: string; label: string }[];
}

type FieldValues = Record<string, string | null>;

interface EditableInfoCardProps {
  title: string;
  fields: EditableInfoField[];
  values: FieldValues | null;
  emptyMessage?: string;
  onSave: (updates: FieldValues) => Promise<{ error: unknown }>;
}

const EditableInfoCard = ({
  title,
  fields,
  values,
  emptyMessage = "لا تتوفر بيانات",
  onSave,
}: EditableInfoCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FieldValues>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (values) setForm(values);
  }, [values]);

  if (!values) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const handleCancel = () => {
    setForm(values);
    setEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: saveError } = await onSave(form);

    setSaving(false);

    if (saveError) {
      setError("حدث خطأ أثناء حفظ التعديلات");
      return;
    }

    setSuccess(true);
    setEditMode(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {!editMode && (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            تعديل
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs text-gray-400 mb-1">
              {field.label}
            </label>
            {editMode ? (
              field.type === "select" ? (
                <select
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- اختر --</option>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )
            ) : (
              <p className="text-sm text-gray-900">
                {field.type === "select"
                  ? (field.options?.find((o) => o.value === values[field.key])
                      ?.label ?? "غير محدد")
                  : values[field.key] || "غير محدد"}
              </p>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && !editMode && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          تم حفظ التعديلات بنجاح
        </div>
      )}

      {editMode && (
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            حفظ
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditableInfoCard;
