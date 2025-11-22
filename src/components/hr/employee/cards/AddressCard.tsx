import { Edit } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";
import { useEffect, useState } from "react";

interface AddressCardProps {
  employee: fullEmployee;
  onSave?: (data: fullEmployee) => void;
}

const AddressCard = ({ employee, onSave }: AddressCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<fullEmployee>(employee);

  useEffect(() => {
    setFormData(employee);
  }, [employee]);

  const updateField = (key: keyof fullEmployee, value: string | undefined) => {
    setFormData(
      (s) =>
        ({
          ...(s as unknown as Record<string, unknown>),
          [key]: value,
        }) as unknown as fullEmployee
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">العنوان</h4>
        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm"
              onClick={() => {
                onSave?.(formData);
                setEditMode(false);
              }}
            >
              حفظ
            </button>
            <button
              className="px-3 py-1 rounded-md bg-gray-100 text-sm"
              onClick={() => {
                setFormData(employee);
                setEditMode(false);
              }}
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
