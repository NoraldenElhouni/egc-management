import { Edit } from "lucide-react";
import { FullEmployee } from "../../../types/extended.type";
import { formatDate } from "../../../utils/helpper";
import { useEffect, useState } from "react";

interface EmployeeHeaderCardProps {
  employee: FullEmployee;
  onSave?: (data: FullEmployee) => void;
}

const EmployeeHeaderCard = ({ employee, onSave }: EmployeeHeaderCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FullEmployee>(employee);

  useEffect(() => setFormData(employee), [employee]);

  const updateField = (key: keyof FullEmployee, value: string | undefined) => {
    setFormData(
      (s) =>
        ({
          ...(s as unknown as Record<string, unknown>),
          [key]: value,
        }) as unknown as FullEmployee
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-4 col-span-1 md:col-span-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
            {(formData.first_name?.[0] ?? "") + (formData.last_name?.[0] ?? "")}
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
              {editMode ? (
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={formData.employee_id ?? formData.id ?? ""}
                  onChange={(e) => updateField("employee_id", e.target.value)}
                />
              ) : (
                <>{employee.employee_id ?? employee.id ?? "N/A"}</>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400">الحالة</div>
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.status ?? ""}
                    onChange={(e) => updateField("status", e.target.value)}
                  />
                ) : (
                  <span>{employee.status ?? "غير محدد"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="text-sm text-gray-700 space-y-3">
            <div>
              <div className="text-xs text-gray-400">تاريخ الانضمام</div>
              <div className="mt-1">
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.date_of_joining ?? ""}
                    onChange={(e) =>
                      updateField("date_of_joining", e.target.value)
                    }
                  />
                ) : (
                  <>
                    {formatDate(
                      employee.date_of_joining ?? employee.created_at
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400">المدير المباشر</div>
              <div className="mt-1">غير محدد</div>
            </div>

            <div>
              <div className="text-xs text-gray-400">نوع التوظيف</div>
              <div className="mt-1">
                {editMode ? (
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.employee_type ?? ""}
                    onChange={(e) =>
                      updateField("employee_type", e.target.value)
                    }
                  />
                ) : (
                  <>{employee.employee_type ?? "غير محدد"}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
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
    </div>
  );
};

export default EmployeeHeaderCard;
