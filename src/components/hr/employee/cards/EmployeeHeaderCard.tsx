import { Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FullEmployee } from "../../../../types/extended.type";
import { formatDate } from "../../../../utils/helpper";
import {
  EMPLOYEE_TYPE,
  EmployeeStatus,
  EmployeeType,
  STATUS_OPTIONS,
} from "../../../../enum/employee";

export type EmployeeHeaderValues = Pick<
  FullEmployee,
  | "first_name"
  | "last_name"
  | "employee_id"
  | "status"
  | "date_of_joining"
  | "employee_type"
>;

interface EmployeeHeaderCardProps {
  employee: FullEmployee;
  onSave?: (data: EmployeeHeaderValues) => Promise<void> | void;
}

const EmployeeHeaderCard = ({ employee, onSave }: EmployeeHeaderCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<EmployeeHeaderValues>(
    () => ({
      first_name: employee.first_name ?? null,
      last_name: employee.last_name ?? null,
      employee_id: employee.employee_id ?? null,
      status: employee.status ?? null,
      date_of_joining: employee.date_of_joining ?? null,
      employee_type: employee.employee_type ?? null,
    }),
    [
      employee.first_name,
      employee.last_name,
      employee.employee_id,
      employee.status,
      employee.date_of_joining,
      employee.employee_type,
    ]
  );

  const [formData, setFormData] = useState<EmployeeHeaderValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof EmployeeHeaderValues>(
    key: K,
    value: EmployeeHeaderValues[K]
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
      setEditMode(false); // ✅ close only on success
    } finally {
      setSaving(false);
    }
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
                    disabled={saving}
                  />
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.last_name ?? ""}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    disabled={saving}
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
                  value={formData.employee_id ?? employee.id ?? ""}
                  onChange={(e) => updateField("employee_id", e.target.value)}
                  disabled={true}
                />
              ) : (
                <>{employee.employee_id ?? employee.id ?? "N/A"}</>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400">الحالة</div>
                {editMode ? (
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.status ?? ""}
                    onChange={(e) =>
                      updateField("status", e.target.value as EmployeeStatus)
                    }
                    disabled={saving}
                  >
                    <option value="" disabled>
                      اختر الحالة
                    </option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`font-medium ${employee.status === "inactive" ? "text-red-600" : "text-green-600"}`}
                  >
                    {STATUS_OPTIONS.find((o) => o.value === employee.status)
                      ?.label ?? "غير محدد"}
                  </span>
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
                    disabled={saving}
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
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={formData.employee_type ?? ""}
                    onChange={(e) =>
                      updateField(
                        "employee_type",
                        e.target.value as EmployeeType
                      )
                    }
                    disabled={saving}
                  >
                    <option value="" disabled>
                      اختر النوع
                    </option>
                    {EMPLOYEE_TYPE.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {" "}
                    {EMPLOYEE_TYPE.find(
                      (o) => o.value === employee.employee_type
                    )?.label ?? "غير محدد"}
                  </>
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
            aria-label="Edit header"
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
    </div>
  );
};

export default EmployeeHeaderCard;
