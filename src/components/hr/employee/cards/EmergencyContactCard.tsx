import { Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullEmployee } from "../../../../types/extended.type";

export type EmergencyContactValues = Pick<
  FullEmployee,
  "emergency_contact" | "emergency_contact_relation" | "emergency_contact_phone"
>;

interface EmergencyContactCardProps {
  employee: FullEmployee;
  onSave?: (data: EmergencyContactValues) => Promise<void> | void;
}

const EmergencyContactCard = ({
  employee,
  onSave,
}: EmergencyContactCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<EmergencyContactValues>(
    () => ({
      emergency_contact: employee.emergency_contact ?? null,
      emergency_contact_relation: employee.emergency_contact_relation ?? null,
      emergency_contact_phone: employee.emergency_contact_phone ?? null,
    }),
    [
      employee.emergency_contact,
      employee.emergency_contact_relation,
      employee.emergency_contact_phone,
    ]
  );

  const [formData, setFormData] =
    useState<EmergencyContactValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof EmergencyContactValues>(
    key: K,
    value: EmergencyContactValues[K]
  ) => {
    setFormData((s) => ({ ...s, [key]: value }));
  };

  const handleCancel = () => {
    setFormData(initialValues);
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!onSave) {
      setEditMode(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(formData); // ✅ await update + refetch
      setEditMode(false); // ✅ close only after success
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">
          جهة الاتصال في حالة الطوارئ
        </h4>

        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
            aria-label="Edit emergency contact"
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "..." : "حفظ"}
            </button>

            <button
              className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleCancel}
              type="button"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <div className="text-xs text-gray-400">الاسم</div>
        {editMode ? (
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={formData.emergency_contact ?? ""}
            onChange={(e) => updateField("emergency_contact", e.target.value)}
            disabled={saving}
          />
        ) : (
          <div className="mt-1">{employee.emergency_contact ?? "غير محدد"}</div>
        )}

        <div className="mt-3 text-xs text-gray-400">العلاقة</div>
        {editMode ? (
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={formData.emergency_contact_relation ?? ""}
            onChange={(e) =>
              updateField("emergency_contact_relation", e.target.value)
            }
            disabled={saving}
          />
        ) : (
          <div className="mt-1">
            {employee.emergency_contact_relation ?? "غير محدد"}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-400">رقم الهاتف</div>
        {editMode ? (
          <input
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={formData.emergency_contact_phone ?? ""}
            onChange={(e) =>
              updateField("emergency_contact_phone", e.target.value)
            }
            disabled={saving}
          />
        ) : (
          <div className="mt-1">
            {employee.emergency_contact_phone ?? "غير محدد"}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContactCard;
