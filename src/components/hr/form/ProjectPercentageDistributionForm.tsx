import { useMemo, useState } from "react";
import { usePayroll } from "../../../hooks/usePayroll";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import {
  PercentageDistributionFormValues,
  PercentageDistributionSchema,
} from "../../../types/schema/PercentageDistribution.schema";
import { useProjectWithAssignments } from "../../../hooks/useProjects";
import LoadingPage from "../../ui/LoadingPage";
import ErrorPage from "../../ui/errorPage";
import { formatCurrency } from "../../../utils/helpper";

interface ProjectPercentageDistributionFormProps {
  projectId: string;
}

const ProjectPercentageDistributionForm = ({
  projectId,
}: ProjectPercentageDistributionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { PercentageDistribution } = usePayroll();
  const {
    error,
    loading: projectLoading,
    project,
  } = useProjectWithAssignments(projectId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PercentageDistributionFormValues>({
    resolver: zodResolver(PercentageDistributionSchema),
    defaultValues: {
      project_id: projectId,
      employees:
        project?.project_assignments?.map((a) => ({
          id: a.user_id as string,
          amount: 0,
        })) || [],
      company: {
        amount: 0,
      },
    },
  });
  console.log("Form errors:", project?.project_percentage?.period_percentage);

  // Prefill project_id and employee rows when project loads
  const assignments = useMemo(
    () => project?.project_assignments ?? [],
    [project]
  );
  const periodAmount = project?.project_percentage?.period_percentage ?? 0;

  // Build default values after project is fetched
  const defaultEmployees = useMemo(
    () => assignments.map((a) => ({ id: a.user_id as string, amount: 0 })),
    [assignments]
  );

  // Keep form synced when project changes
  const employees = watch("employees") ?? defaultEmployees;
  const companyAmount = watch("company.amount") ?? 0;

  const totalAssigned = useMemo(
    () =>
      (employees?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0) +
      (Number(companyAmount) || 0),
    [employees, companyAmount]
  );

  const remaining = useMemo(
    () => Math.max(0, periodAmount - totalAssigned),
    [periodAmount, totalAssigned]
  );

  const onSubmit = async (data: PercentageDistributionFormValues) => {
    setLoading(true);
    // Validate total does not exceed period amount
    const currentTotal =
      (data.employees?.reduce((s, e) => s + (e.amount || 0), 0) || 0) +
      (data.company?.amount || 0);
    if (currentTotal > periodAmount) {
      setSuccess("إجمالي المبالغ يتجاوز نسبة الفترة. فضلاً عدّل القيم.");
      setLoading(false);
      return;
    }
    // Ensure project_id is set
    data.project_id = projectId;
    const result = await PercentageDistribution(data);
    if (result.success) {
      setSuccess("تم حفظ توزيع النسبة بنجاح.");
      reset();
      // refresh project data to get updated period percentage
    } else {
      setSuccess("فشل حفظ توزيع النسبة. حاول مرة أخرى.");
    }

    setLoading(false);
  };

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
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-semibold mb-3">
          مشروع
          <span className="mx-2 font-bold">{project?.name ?? "—"}</span>
          <span className="text-sm text-gray-600">
            ({project?.code ?? "—"})
          </span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">إجمالي نسبة المشروع</div>
            <div className="mt-2 text-lg font-medium text-primary">
              {formatCurrency(
                project?.project_percentage?.total_percentage ?? 0,
                "LYD"
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">نسبة الفترة</div>
            <div className="mt-2 text-lg font-medium text-primary">
              {formatCurrency(
                project?.project_percentage?.period_percentage ?? 0,
                "LYD"
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              من {project?.project_percentage?.period_start ?? "—"} إلى الآن
            </div>
          </div>
        </div>
      </div>
      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-success/10 text-success">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Project ID (hidden) */}
        <input type="hidden" value={projectId} {...register("project_id")} />

        {/* Employees distribution list */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-sm text-gray-600">المبلغ المتاح للفترة</div>
              <div className="mt-1 text-lg font-medium text-primary">
                {formatCurrency(periodAmount, "LYD")}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm ${totalAssigned > periodAmount ? "text-error" : "text-gray-600"}`}
              >
                الإجمالي المعيّن
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${totalAssigned > periodAmount ? "text-error" : "text-primary"}`}
              >
                {formatCurrency(totalAssigned, "LYD")}
              </div>
              <div className="text-xs text-gray-500">
                المتبقي: {formatCurrency(remaining, "LYD")}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 border rounded-lg">
            {assignments.map((a, idx) => {
              const fullName =
                `${a.employees?.first_name ?? ""} ${a.employees?.last_name ?? ""}`.trim() ||
                a.user_id;
              return (
                <div key={a.user_id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 text-right">
                    <div className="font-medium">{fullName}</div>
                  </div>
                  <div className="w-44">
                    <label className="block text-xs text-gray-600 mb-1">
                      المبلغ
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-full border rounded px-3 py-2 text-left"
                      {...register(`employees.${idx}.amount`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.employees?.[idx]?.amount && (
                      <div className="mt-1 text-xs text-error">
                        {errors.employees[idx]?.amount?.message as string}
                      </div>
                    )}
                  </div>
                  <input
                    type="hidden"
                    {...register(`employees.${idx}.id`)}
                    defaultValue={a.user_id}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Company share */}
        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-1">حصة الشركة</label>
          <input
            type="number"
            step="0.01"
            min={0}
            className="w-full border rounded px-3 py-2 text-left"
            {...register("company.amount", { valueAsNumber: true })}
          />
          {errors.company?.amount && (
            <div className="mt-1 text-xs text-red-600">
              {errors.company.amount.message as string}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </form>
    </div>
  );
};

export default ProjectPercentageDistributionForm;
