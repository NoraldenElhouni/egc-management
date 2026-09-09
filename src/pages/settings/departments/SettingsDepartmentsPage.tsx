import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Users } from "lucide-react";
import {
  useCreateDepartment,
  useDepartments,
} from "../../../hooks/permissions/useDepartments";
import Button from "../../../components/ui/Button";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

// =====================================================================
// Screen 1, list view — implementation guide section 4.1 steps 1-3.
// =====================================================================

export default function SettingsDepartmentsPage() {
  const { data: departments, isLoading, error } = useDepartments();
  const createDepartment = useCreateDepartment();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setNameAr("");
    setCode("");
    setFormError(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!name.trim() || !code.trim()) {
      setFormError("الاسم بالإنجليزية والرمز حقلان مطلوبان.");
      return;
    }
    try {
      await createDepartment.mutateAsync({
        name,
        name_ar: nameAr,
        code,
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "تعذر إنشاء القسم. تأكد من أن الاسم والرمز غير مستخدمين.",
      );
    }
  };

  if (isLoading) return <LoadingPage label="جاري تحميل الأقسام..." />;
  if (error)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "خطأ غير معروف"}
        label="خطأ في تحميل الأقسام"
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              إدارة الأقسام
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              الأقسام هي الموقع في الهيكل التنظيمي، ومستقلة تماماً عن الأدوار.
              يمكن للقسم أن يمنح صلاحيات أساسية لكل من ينتمي إليه.
            </p>
          </div>
          <Button
            variant="primary-light"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={15} className="ml-1" />
            قسم جديد
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">قسم جديد</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-gray-600">
                  الاسم (إنجليزي) *
                </label>
                <input
                  dir="ltr"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Surveying"
                  className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-gray-600">
                  الاسم (عربي)
                </label>
                <input
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مساحة"
                  className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-gray-600">الرمز *</label>
                <input
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SURV"
                  className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              يُنشأ القسم بدون أي صلاحيات. الإنشاء ومنح الصلاحيات إجراءان
              منفصلان، حتى لا يرث قسم جديد أي شيء بالخطأ.
            </p>

            {formError && (
              <p className="text-xs text-red-600">{formError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={createDepartment.isPending}
                onClick={handleCreate}
              >
                إنشاء
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {(departments ?? []).length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                لا توجد أقسام حالياً
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {(departments ?? []).map((department) => (
                <li key={department.id}>
                  <Link
                    to={`/settings/permissions/departments/${department.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="bg-gray-100 rounded-lg p-2">
                        <Building2 size={16} className="text-gray-500" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          {department.name_ar || department.name}
                        </span>
                        <span className="block text-[11px] text-gray-400" dir="ltr">
                          {department.name} · {department.code}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Users size={14} />
                      {department.member_count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
