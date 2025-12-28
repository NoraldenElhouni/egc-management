import { Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullEmployee } from "../../../types/extended.type";

export type QuickStatsValues = {
  base_salary: FullEmployee["base_salary"] | null;
  nationality: FullEmployee["nationality"] | null;
};

interface QuickStatsProps {
  employee: FullEmployee;
  onSave?: (data: QuickStatsValues) => Promise<void> | void;
}

const QuickStats = ({ employee, onSave }: QuickStatsProps) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<QuickStatsValues>(
    () => ({
      base_salary: employee.base_salary ?? null,
      nationality: employee.nationality ?? null,
    }),
    [employee.base_salary, employee.nationality]
  );

  const [formData, setFormData] = useState<QuickStatsValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof QuickStatsValues>(
    key: K,
    value: QuickStatsValues[K]
  ) => setFormData((s) => ({ ...s, [key]: value }));

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
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  // You can calculate this from employee.projects if you want
  const derivedProjectsCount = employee.projects?.length ?? 0;

  return (
    <div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Projects count (read-only) + edit/save buttons */}
        <div className="bg-white p-4 rounded-md border text-center relative">
          <div className="absolute top-2 right-2">
            {!editMode ? (
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setEditMode(true)}
                aria-label="Edit quick stats"
              >
                <Edit className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "..." : "حفظ"}
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-gray-100 text-sm disabled:opacity-50"
                  onClick={handleCancel}
                  disabled={saving}
                  type="button"
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

        {/* Base salary */}
        <div className="bg-white p-4 rounded-md border text-center">
          <div className="text-xs text-gray-400">الراتب الأساسي</div>
          <div className="font-semibold text-gray-800 mt-1">
            {editMode ? (
              <input
                className="w-full text-center border rounded px-2 py-1 text-sm disabled:opacity-50"
                type="number"
                value={formData.base_salary ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  updateField("base_salary", v === "" ? null : Number(v));
                }}
                disabled={saving}
              />
            ) : (
              <>
                {employee.base_salary != null
                  ? `${employee.base_salary}`
                  : "غير محدد"}
              </>
            )}
          </div>
        </div>

        {/* Nationality */}
        <div className="bg-white p-4 rounded-md border text-center">
          <div className="text-xs text-gray-400">الجنسية</div>
          <div className="font-semibold text-gray-800 mt-1">
            {editMode ? (
              <input
                className="w-full text-center border rounded px-2 py-1 text-sm disabled:opacity-50"
                value={formData.nationality ?? ""}
                onChange={(e) => updateField("nationality", e.target.value)}
                disabled={saving}
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
