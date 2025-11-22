import { Edit } from "lucide-react";
import { fullEmployee } from "../../../types/extended.type";
import { useEffect, useState } from "react";

interface QuickStatsProps {
  employee: fullEmployee;
  onSave?: (data: fullEmployee) => void;
}

const QuickStats = ({ employee, onSave }: QuickStatsProps) => {
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

  const derivedProjectsCount = 1; // keep same as before

  return (
    <div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border text-center relative">
          <div className="absolute top-2 right-2">
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

          <div className="text-xs text-gray-400">عدد المشاريع</div>
          <div className="font-semibold text-gray-800 mt-1">
            {derivedProjectsCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border text-center">
          <div className="text-xs text-gray-400">الراتب الأساسي</div>
          <div className="font-semibold text-gray-800 mt-1">
            {editMode ? (
              <input
                className="w-full text-center border rounded px-2 py-1 text-sm"
                type="number"
                value={formData.base_salary ?? ""}
                onChange={(e) => updateField("base_salary", e.target.value)}
              />
            ) : (
              <>
                {employee.base_salary ? `${employee.base_salary}` : "غير محدد"}
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border text-center">
          <div className="text-xs text-gray-400">الجنسية</div>
          <div className="font-semibold text-gray-800 mt-1">
            {editMode ? (
              <input
                className="w-full text-center border rounded px-2 py-1 text-sm"
                value={formData.nationality ?? ""}
                onChange={(e) => updateField("nationality", e.target.value)}
              />
            ) : (
              <>{employee.nationality ?? "غير محدد"}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
