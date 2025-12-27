import { Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullEmployee } from "../../../../types/extended.type";

export type AddressValues = Pick<FullEmployee, "address">;

interface AddressCardProps {
  employee: FullEmployee;
  onSave?: (data: AddressValues) => Promise<void> | void;
}

const AddressCard = ({ employee, onSave }: AddressCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<AddressValues>(
    () => ({
      address: employee.address ?? null,
    }),
    [employee.address]
  );

  const [formData, setFormData] = useState<AddressValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof AddressValues>(
    key: K,
    value: AddressValues[K]
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
      await onSave(formData); // ✅ await async save + refetch
      setEditMode(false); // ✅ only close after success
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">العنوان</h4>

        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
            aria-label="Edit address"
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "..." : "حفظ"}
            </button>

            <button
              className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
              disabled={saving}
              onClick={handleCancel}
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <div className="text-xs text-gray-400">العنوان</div>

          {editMode ? (
            <input
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={formData.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={saving}
            />
          ) : (
            <div className="mt-1">{employee.address ?? "غير محدد"}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
