import { useEffect, useMemo, useState } from "react";
import { usePayroll } from "../../../hooks/usePayroll";
import { useForm, useFieldArray } from "react-hook-form";
import {
  FixedEmployeesPayrollSchema,
  FixedPayrollFormValues,
} from "../../../types/schema/fixedPayroll.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import { Search, Wallet, AlertCircle } from "lucide-react";

interface EmployeesPayrollFormProps {
  projectId: string;
}

const EmployeesPayrollForm = ({ projectId }: EmployeesPayrollFormProps) => {
  const { fixedEmployees } = usePayroll();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { fixedPayroll } = usePayroll();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FixedPayrollFormValues>({
    resolver: zodResolver(FixedEmployeesPayrollSchema),
    defaultValues: {
      project_id: projectId,
      employees: [],
    },
  });

  // We still need useFieldArray for proper RHF integration
  useFieldArray({
    control,
    name: "employees",
  });

  // Initialize form when fixedEmployees load
  useEffect(() => {
    if (fixedEmployees?.length) {
      reset({
        employees: fixedEmployees.map((emp) => ({
          id: emp.id,
          amount: emp.base_salary,
        })),
      });
    }
  }, [fixedEmployees, reset]);

  // Filter employees based on search query
  const filteredIndices = useMemo(() => {
    if (!fixedEmployees || fixedEmployees.length === 0) return [];

    const q = query.trim().toLowerCase();
    if (!q) return fixedEmployees.map((_, idx) => idx);

    return fixedEmployees
      .map((emp, idx) => {
        const name =
          `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.toLowerCase();
        const empId = `${emp.employee_id ?? ""}`.toLowerCase();

        return name.includes(q) || empId.includes(q) ? idx : null;
      })
      .filter((idx): idx is number => idx !== null);
  }, [fixedEmployees, query]);

  const onSubmit = async (data: FixedPayrollFormValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      // TODO: Replace with actual API call
      const res = await fixedPayroll(data);
      if (!res.success) {
        setSubmitError(res.message || "حدث خطأ أثناء الحفظ");
        throw new Error("Payroll submission failed");
      }
      new Notification("تم حفظ الرواتب الثابتة بنجاح", {
        body: "تم تحديث رواتب الموظفين الأساسيين.",
      });

      reset({ project_id: projectId, employees: data.employees });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (fixedEmployees?.length) {
      reset({
        employees: fixedEmployees.map((emp) => ({
          id: emp.id,
          amount: emp.base_salary,
        })),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                الرواتب الثابتة
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                تعديل الرواتب الأساسية للموظفين
              </p>
            </div>
            {isDirty && (
              <div className="text-xs text-amber-600 font-medium">
                تغييرات غير محفوظة
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم الموظف أو رقمه..."
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
            />
          </div>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">خطأ في الحفظ</p>
              <p className="text-xs text-red-700 mt-1">{submitError}</p>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="text-red-400 hover:text-red-600 transition"
            >
              ×
            </button>
          </div>
        )}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Table header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm font-semibold text-gray-900">
              الموظفون ({filteredIndices.length} من{" "}
              {fixedEmployees?.length ?? 0})
            </div>
            <div className="text-xs text-gray-500">العملة: LYD</div>
          </div>

          {/* Content */}
          {!fixedEmployees || fixedEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                لا يوجد موظفون
              </p>
              <p className="text-xs text-gray-500 mt-1">
                لم يتم العثور على موظفين بنظام الرواتب الثابتة
              </p>
            </div>
          ) : filteredIndices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-700">لا توجد نتائج</p>
              <p className="text-xs text-gray-500 mt-1">
                جرّب تغيير كلمة البحث
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredIndices.map((index) => {
                const emp = fixedEmployees?.[index];
                if (!emp) return null;

                const name =
                  `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
                const hasError = errors.employees?.[index]?.amount;

                return (
                  <div
                    key={emp.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {name || "بدون اسم"}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {emp.employee_id
                          ? `#${emp.employee_id}`
                          : `ID: ${emp.id}`}
                      </div>
                    </div>

                    <div className="w-44">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`employees.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        className={`w-full rounded-lg border ${
                          hasError
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-gray-200 focus:border-gray-400 focus:ring-gray-100"
                        } bg-white px-3 py-2 text-sm outline-none focus:ring-2 transition`}
                        aria-label={`راتب ${name}`}
                      />
                      {hasError && (
                        <p className="text-xs text-red-600 mt-1">
                          {hasError.message}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 w-10 text-right">
                      LYD
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer actions */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-xs text-gray-500">
              {isDirty ? "تم التعديل - لا تنسى الحفظ" : "لا توجد تغييرات"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToDefaults}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isDirty}
              >
                إعادة تعيين
              </button>

              <Button type="submit" disabled={loading || !isDirty}>
                {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </div>
        </form>

        {/* Info card */}
        {fixedEmployees && fixedEmployees.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium">💡 معلومة</p>
            <p className="mt-1 text-blue-700">
              يتم استخدام useFieldArray للحفاظ على التزامن الصحيح بين الفلترة
              والنموذج. جميع التغييرات يتم تتبعها تلقائياً.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPayrollForm;
