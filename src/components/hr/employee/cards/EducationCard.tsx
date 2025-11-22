import { Edit } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";
import { useEffect, useState } from "react";

interface EducationCardProps {
  employee: fullEmployee;
  onSave?: (data: fullEmployee) => void;
}

const EducationCard = ({ employee, onSave }: EducationCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<fullEmployee>(employee);

  useEffect(() => {
    setFormData(employee);
  }, [employee]);

  const updateCert = (idx: number, key: string, value: string) => {
    const certs = formData.employee_certifications
      ? [...formData.employee_certifications]
      : [];
    certs[idx] = { ...(certs[idx] ?? {}), [key]: value } as any;
    setFormData(
      (s) =>
        ({
          ...(s as unknown as Record<string, unknown>),
          employee_certifications: certs,
        }) as unknown as fullEmployee
    );
  };

  const addCert = () => {
    const certs = formData.employee_certifications
      ? [...formData.employee_certifications]
      : [];
    const newCert = { certification: "" } as Record<string, string>;
    certs.push(newCert as unknown as (typeof certs)[number]);
    setFormData(
      (s) =>
        ({
          ...(s as unknown as Record<string, unknown>),
          employee_certifications: certs,
        }) as unknown as fullEmployee
    );
  };

  const removeCert = (idx: number) => {
    const certs = formData.employee_certifications
      ? [...formData.employee_certifications]
      : [];
    certs.splice(idx, 1);
    setFormData(
      (s) =>
        ({
          ...(s as unknown as Record<string, unknown>),
          employee_certifications: certs,
        }) as unknown as fullEmployee
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">التعليم</h4>
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

      <div className="mt-4 space-y-4 text-sm text-gray-700">
        {formData.employee_certifications &&
        formData.employee_certifications.length > 0 ? (
          formData.employee_certifications.map((ed, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-md relative">
              {editMode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 w-full border rounded px-2 py-1 text-sm"
                      value={ed.certification ?? ""}
                      onChange={(e) =>
                        updateCert(idx, "certification", e.target.value)
                      }
                    />
                    <button
                      className="text-sm text-red-600 px-2 py-1"
                      onClick={() => removeCert(idx)}
                      aria-label="حذف"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-semibold">{ed.certification}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    GPA 3.3 • 2025
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400">لا يوجد شهادات تعليمية</div>
        )}
        {editMode && (
          <div className="mt-3">
            <button
              className="px-3 py-1 rounded-md bg-primary text-white text-sm"
              onClick={addCert}
            >
              أضف شهادة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationCard;
