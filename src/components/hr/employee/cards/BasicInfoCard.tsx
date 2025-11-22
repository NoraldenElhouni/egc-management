import { ArrowRight, Edit, Phone, User } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";
import { useState, useEffect } from "react";

interface BasicInfoCardProps {
  employee: fullEmployee;
  onSave?: (data: fullEmployee) => void;
}
const BasicInfoCard = ({ employee, onSave }: BasicInfoCardProps) => {
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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-md font-medium text-gray-800">
          المعلومات الأساسية
        </h4>
        {!editMode ? (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setEditMode(true)}
            aria-label="Edit"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 col-span-1 md:col-span-2">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
            {(formData.first_name ?? employee.first_name)?.[0] ?? ""}
            {(formData.last_name ?? employee.last_name)?.[0] ?? ""}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-800">
              {editMode ? (
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.first_name ?? ""}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.last_name ?? ""}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>
              ) : (
                <>
                  {employee.first_name ?? "غير محدد"} {employee.last_name ?? ""}
                </>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {employee.id?.slice(0, 13) ?? "N/A"}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.gender ?? ""}
                    onChange={(e) => updateField("gender", e.target.value)}
                  />
                ) : (
                  <span>{employee.gender ?? "غير محدد"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                ) : (
                  <span>{employee.email ?? "غير محدد"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.phone_number ?? ""}
                    onChange={(e) =>
                      updateField("phone_number", e.target.value)
                    }
                  />
                ) : (
                  <span>{employee.phone_number ?? "غير محدد"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <div className="text-xs text-gray-400">مكان الميلاد</div>
              {editMode ? (
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formData.place_of_birth ?? ""}
                  onChange={(e) =>
                    updateField("place_of_birth", e.target.value)
                  }
                />
              ) : (
                <div>{employee.place_of_birth ?? "غير محدد"}</div>
              )}

              <div className="mt-3 text-xs text-gray-400">تاريخ الميلاد</div>
              {editMode ? (
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formData.dob ?? ""}
                  onChange={(e) => updateField("dob", e.target.value)}
                />
              ) : (
                <div>{employee.dob ?? "غير محدد"}</div>
              )}

              <div className="mt-3 text-xs text-gray-400">فصيلة الدم</div>
              {editMode ? (
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formData.blood_type ?? ""}
                  onChange={(e) => updateField("blood_type", e.target.value)}
                />
              ) : (
                <div>{employee.blood_type ?? "غير محدد"}</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400">الحالة الاجتماعية</div>
              {editMode ? (
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formData.marital_status ?? ""}
                  onChange={(e) =>
                    updateField("marital_status", e.target.value)
                  }
                />
              ) : (
                <div>{employee.marital_status ?? "غير محدد"}</div>
              )}

              <div className="mt-3 text-xs text-gray-400">الجنسية</div>
              {editMode ? (
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={formData.nationality ?? ""}
                  onChange={(e) => updateField("nationality", e.target.value)}
                />
              ) : (
                <div>{employee.nationality ?? "غير محدد"}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCard;
