import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "../../../utils/helpper";
import { useProjectWithAssignments } from "../../../hooks/useProjects";
import LoadingPage from "../../ui/LoadingPage";
import ErrorPage from "../../ui/errorPage";
import {
  PercentageDistributionFormValues,
  PercentageDistributionSchema,
} from "../../../types/schema/PercentageDistribution.schema";
import { usePayroll } from "../../../hooks/usePayroll";

interface ProjectPercentageDistributionFormProps {
  projectId: string;
}

const ProjectPercentageDistributionForm = ({
  projectId,
}: ProjectPercentageDistributionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { PercentageDistribution } = usePayroll();

  const {
    error,
    loading: projectLoading,
    project,
  } = useProjectWithAssignments(projectId);

  const cashPercentage = project?.project_percentage?.find(
    (pp) => pp.type === "cash"
  );
  const bankPercentage = project?.project_percentage?.find(
    (pp) => pp.type === "bank"
  );

  const totalCashAvailable = cashPercentage?.period_percentage || 0;
  const totalBankAvailable = bankPercentage?.period_percentage || 0;
  const totalAvailable = totalCashAvailable + totalBankAvailable;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PercentageDistributionFormValues>({
    resolver: zodResolver(PercentageDistributionSchema),
    defaultValues: {
      project_id: projectId,
      employee: [],
      company: {
        percentage: 0,
        CashAmount: 0,
        BankAmount: 0,
        cash_held: 0,
        bank_held: 0,
        discount: 0,
        total: 0,
        note: "",
      },
      total: 0,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "employee",
  });

  // Initialize form when project loads
  useEffect(() => {
    if (project && project.project_assignments) {
      reset({
        project_id: project.id,
        employee: project.project_assignments.map((pa) => ({
          employee_id: pa.user_id,
          percentage: 0,
          CashAmount: 0,
          BankAmount: 0,
          cash_held: 0,
          bank_held: 0,
          discount: 0,
          total: 0,
          note: "",
        })),
        company: {
          percentage: 0,
          CashAmount: 0,
          BankAmount: 0,
          cash_held: 0,
          bank_held: 0,
          discount: 0,
          total: 0,
          note: "",
        },
        total: 0,
      });
    }
  }, [project, reset]);

  const watchEmployees = watch("employee");
  const watchCompany = watch("company");

  // Calculate amounts when percentage changes
  useEffect(() => {
    if (!watchEmployees) return;

    watchEmployees.forEach((emp, index) => {
      const percentage = emp.percentage || 0;
      const cashAmount = (totalCashAvailable * percentage) / 100;
      const bankAmount = (totalBankAvailable * percentage) / 100;
      const cashHeld = emp.cash_held || 0;
      const bankHeld = emp.bank_held || 0;
      const discount = emp.discount || 0;
      const total = cashAmount - cashHeld + (bankAmount - bankHeld) - discount;

      setValue(`employee.${index}.CashAmount`, cashAmount);
      setValue(`employee.${index}.BankAmount`, bankAmount);
      setValue(`employee.${index}.total`, total);
    });
  }, [
    watchEmployees?.map((e) => e.percentage).join(","),
    watchEmployees?.map((e) => e.cash_held).join(","),
    watchEmployees?.map((e) => e.bank_held).join(","),
    watchEmployees?.map((e) => e.discount).join(","),
    totalCashAvailable,
    totalBankAvailable,
    setValue,
  ]);

  useEffect(() => {
    if (!watchCompany) return;

    const percentage = watchCompany.percentage || 0;
    const cashAmount = (totalCashAvailable * percentage) / 100;
    const bankAmount = (totalBankAvailable * percentage) / 100;
    const cashHeld = watchCompany.cash_held || 0;
    const bankHeld = watchCompany.bank_held || 0;
    const discount = watchCompany.discount || 0;
    const total = cashAmount - cashHeld + (bankAmount - bankHeld) - discount;

    setValue("company.CashAmount", cashAmount);
    setValue("company.BankAmount", bankAmount);
    setValue("company.total", total);
  }, [
    watchCompany?.percentage,
    watchCompany?.cash_held,
    watchCompany?.bank_held,
    watchCompany?.discount,
    totalCashAvailable,
    totalBankAvailable,
    setValue,
  ]);

  // Calculate total percentages
  const employeeTotalPercentage =
    watchEmployees?.reduce((sum, emp) => sum + (emp.percentage || 0), 0) || 0;
  const companyPercentage = watchCompany?.percentage || 0;
  const grandTotalPercentage = employeeTotalPercentage + companyPercentage;
  const remainingPercentage = 100 - grandTotalPercentage;

  const handleFormSubmit = handleSubmit(
    async (data: PercentageDistributionFormValues) => {
      setLoading(true);
      try {
        const result = await PercentageDistribution(data);
        if (!result.success) {
          setErrorMessage(result.message || "حدث خطأ أثناء حفظ التوزيع");
          alert(result.message || "حدث خطأ أثناء حفظ التوزيع");
        } else {
          setSuccess("تم حفظ توزيع نسب المشروع بنجاح");
          setErrorMessage(null);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("حدث خطأ أثناء حفظ التوزيع");
      } finally {
        setLoading(false);
      }
    }
  );

  if (projectLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المشروع"
        error={error.message}
      />
    );
  }

  if (!project) {
    return <div className="text-center p-6">المشروع غير موجود.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          توزيع نسب المشروع
        </h1>
        <div className="text-lg text-gray-600 mb-4">
          <span className="font-semibold">{project.name}</span>
          <span className="text-sm mr-2">({project.code})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 font-medium mb-1">
              النقدي المتاح
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalCashAvailable, "LYD")}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
            <div className="text-sm text-green-700 font-medium mb-1">
              البنك المتاح
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalBankAvailable, "LYD")}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700 font-medium mb-1">
              الإجمالي المتاح
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(totalAvailable, "LYD")}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-amber-800">النسبة المستخدمة:</span>
              <span
                className={`text-xl font-bold mr-2 ${grandTotalPercentage > 100 ? "text-red-600" : "text-amber-900"}`}
              >
                {grandTotalPercentage.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-sm text-amber-800">المتبقي:</span>
              <span
                className={`text-xl font-bold mr-2 ${remainingPercentage < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {remainingPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          {grandTotalPercentage > 100 && (
            <div className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ تحذير: النسبة الإجمالية تتجاوز 100%
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-800 border border-green-300">
          ✓ {success}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-800 border border-red-300">
          ✗ {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Employees Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
            توزيع الموظفين
          </h2>

          {fields.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              لا يوجد موظفين مسجلين في هذا المشروع
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const employee = project.project_assignments[index];
                const empData = watchEmployees?.[index];

                return (
                  <div
                    key={field.id}
                    className="bg-gray-50 rounded-lg p-5 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {employee.employees?.first_name}{" "}
                        {employee.employees?.last_name}
                      </h3>
                      <div className="text-sm text-gray-600">
                        ID: {employee.user_id.slice(0, 8)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">
                          النسبة المئوية (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          {...register(`employee.${index}.percentage`, {
                            valueAsNumber: true,
                          })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.employee?.[index]?.percentage && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.employee[index]?.percentage?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">
                          النقدي المحجوز
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register(`employee.${index}.cash_held`, {
                            valueAsNumber: true,
                          })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">
                          البنك المحجوز
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register(`employee.${index}.bank_held`, {
                            valueAsNumber: true,
                          })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">
                          الخصم
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register(`employee.${index}.discount`, {
                            valueAsNumber: true,
                          })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">
                          ملاحظات
                        </label>
                        <input
                          type="text"
                          {...register(`employee.${index}.note`)}
                          placeholder="ملاحظات اختيارية"
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-300">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-blue-600 mb-1">نقدي</div>
                        <div className="text-sm font-bold text-blue-900">
                          {formatCurrency(empData?.CashAmount || 0, "LYD")}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-xs text-green-600 mb-1">بنك</div>
                        <div className="text-sm font-bold text-green-900">
                          {formatCurrency(empData?.BankAmount || 0, "LYD")}
                        </div>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <div className="text-xs text-amber-600 mb-1">
                          نقدي محجوز
                        </div>
                        <div className="text-sm font-bold text-amber-900">
                          {formatCurrency(empData?.cash_held || 0, "LYD")}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-xs text-orange-600 mb-1">
                          بنك محجوز
                        </div>
                        <div className="text-sm font-bold text-orange-900">
                          {formatCurrency(empData?.bank_held || 0, "LYD")}
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-xs text-red-600 mb-1">خصم</div>
                        <div className="text-sm font-bold text-red-900">
                          {formatCurrency(empData?.discount || 0, "LYD")}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-xs text-purple-600 mb-1">
                          الإجمالي
                        </div>
                        <div className="text-sm font-bold text-purple-900">
                          {formatCurrency(empData?.total || 0, "LYD")}
                        </div>
                      </div>
                    </div>

                    <input
                      type="hidden"
                      {...register(`employee.${index}.employee_id`)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Company Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
            حصة الشركة
          </h2>

          <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  النسبة المئوية (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register("company.percentage", { valueAsNumber: true })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  النقدي المحجوز
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("company.cash_held", { valueAsNumber: true })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  البنك المحجوز
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("company.bank_held", { valueAsNumber: true })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  الخصم
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("company.discount", { valueAsNumber: true })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  ملاحظات
                </label>
                <input
                  type="text"
                  {...register("company.note")}
                  placeholder="ملاحظات اختيارية"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-indigo-300">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">نقدي</div>
                <div className="text-sm font-bold text-blue-900">
                  {formatCurrency(watchCompany?.CashAmount || 0, "LYD")}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 mb-1">بنك</div>
                <div className="text-sm font-bold text-green-900">
                  {formatCurrency(watchCompany?.BankAmount || 0, "LYD")}
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="text-xs text-amber-600 mb-1">نقدي محجوز</div>
                <div className="text-sm font-bold text-amber-900">
                  {formatCurrency(watchCompany?.cash_held || 0, "LYD")}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-xs text-orange-600 mb-1">بنك محجوز</div>
                <div className="text-sm font-bold text-orange-900">
                  {formatCurrency(watchCompany?.bank_held || 0, "LYD")}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-xs text-red-600 mb-1">خصم</div>
                <div className="text-sm font-bold text-red-900">
                  {formatCurrency(watchCompany?.discount || 0, "LYD")}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-purple-600 mb-1">الإجمالي</div>
                <div className="text-sm font-bold text-purple-900">
                  {formatCurrency(watchCompany?.total || 0, "LYD")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {grandTotalPercentage !== 100 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-right">
              <div className="text-red-800 font-semibold mb-2">
                ⚠️ لا يمكن الحفظ - يجب أن يكون الإجمالي 100% بالضبط
              </div>
              <div className="text-red-700 text-sm">
                {grandTotalPercentage > 100
                  ? `الإجمالي الحالي: ${grandTotalPercentage.toFixed(2)}% (زيادة ${(grandTotalPercentage - 100).toFixed(2)}%)`
                  : `الإجمالي الحالي: ${grandTotalPercentage.toFixed(2)}% (نقص ${(100 - grandTotalPercentage).toFixed(2)}%)`}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleFormSubmit}
            disabled={loading || grandTotalPercentage !== 100}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg shadow-md"
          >
            {loading ? "جاري الحفظ..." : "حفظ التوزيع"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPercentageDistributionForm;
