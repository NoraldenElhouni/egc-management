import { useEffect, useMemo, useState } from "react";
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
  const [samePercentage, setSamePercentage] = useState<Record<string, boolean>>(
    {}
  );
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
    setValue,
    reset,
    formState: { errors },
  } = useForm<PercentageDistributionFormValues>({
    resolver: zodResolver(PercentageDistributionSchema),
    defaultValues: {
      project_id: projectId,
      totals: { bank: 0, cash: 0 },
      employees: [],
      company: { bank: 0, cash: 0 },
    },
  });

  // Prefill project_id and employee rows when project loads
  const assignments = useMemo(
    () => project?.project_assignments ?? [],
    [project]
  );
  const periodAmount = project?.project_percentage?.period_percentage ?? 0;

  // Build defaults after project is fetched
  useEffect(() => {
    const defaultEmployees = assignments.map((a) => ({
      id: a.user_id as string,
      bank: { percentage: 0, amount: 0, held: 0, discount: 0, note: "" },
      cash: { percentage: 0, amount: 0, held: 0, discount: 0, note: "" },
      note: "",
    }));

    reset({
      project_id: projectId,
      totals: { bank: periodAmount, cash: 0 },
      employees: defaultEmployees,
      company: { bank: 0, cash: 0 },
    });

    setSamePercentage((prev) => {
      const next: Record<string, boolean> = { ...prev };
      assignments.forEach((a) => {
        if (next[a.user_id] === undefined) {
          next[a.user_id] = true; // default to one percentage for both
        }
      });
      return next;
    });
  }, [assignments, periodAmount, projectId, reset]);

  const totals = watch("totals");
  const employees = watch("employees") ?? [];
  const company = watch("company");

  // Keep derived amounts in sync with percentages and totals
  useEffect(() => {
    employees.forEach((emp, idx) => {
      const bankPct = emp.bank?.percentage ?? 0;
      const useSame = samePercentage[emp.id];
      const cashPct = useSame ? bankPct : (emp.cash?.percentage ?? 0);

      if (useSame && emp.cash?.percentage !== bankPct) {
        setValue(`employees.${idx}.cash.percentage`, bankPct, {
          shouldDirty: true,
        });
      }

      const bankAmount = Number(((totals?.bank || 0) * bankPct) / 100) || 0;
      const cashAmount = Number(((totals?.cash || 0) * cashPct) / 100) || 0;

      if ((emp.bank?.amount ?? 0) !== bankAmount) {
        setValue(`employees.${idx}.bank.amount`, bankAmount, {
          shouldDirty: true,
        });
      }
      if ((emp.cash?.amount ?? 0) !== cashAmount) {
        setValue(`employees.${idx}.cash.amount`, cashAmount, {
          shouldDirty: true,
        });
      }
    });
  }, [employees, samePercentage, setValue, totals?.bank, totals?.cash]);

  const totalsAssigned = useMemo(() => {
    const bankUsed =
      (employees?.reduce(
        (sum, e) =>
          sum +
          (Number(e.bank?.amount) || 0) +
          (Number(e.bank?.held) || 0) +
          (Number(e.bank?.discount) || 0),
        0
      ) || 0) + (Number(company?.bank) || 0);

    const cashUsed =
      (employees?.reduce(
        (sum, e) =>
          sum +
          (Number(e.cash?.amount) || 0) +
          (Number(e.cash?.held) || 0) +
          (Number(e.cash?.discount) || 0),
        0
      ) || 0) + (Number(company?.cash) || 0);

    return { bankUsed, cashUsed };
  }, [company?.bank, company?.cash, employees]);

  const remaining = useMemo(
    () => ({
      bank: Math.max(0, (totals?.bank || 0) - totalsAssigned.bankUsed),
      cash: Math.max(0, (totals?.cash || 0) - totalsAssigned.cashUsed),
    }),
    [
      totals?.bank,
      totals?.cash,
      totalsAssigned.bankUsed,
      totalsAssigned.cashUsed,
    ]
  );

  const onSubmit = async (data: PercentageDistributionFormValues) => {
    setLoading(true);

    // Validate bank/cash assignments do not exceed totals
    if (totalsAssigned.bankUsed > (data.totals.bank || 0)) {
      setSuccess("إجمالي توزيع البنك يتجاوز المبلغ المتاح. فضلاً عدّل القيم.");
      setLoading(false);
      return;
    }
    if (totalsAssigned.cashUsed > (data.totals.cash || 0)) {
      setSuccess("إجمالي توزيع النقد يتجاوز المبلغ المتاح. فضلاً عدّل القيم.");
      setLoading(false);
      return;
    }

    data.project_id = projectId;
    const result = await PercentageDistribution(data);
    if (result.success) {
      setSuccess("تم حفظ توزيع النسبة بنجاح.");
      reset();
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
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm">
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
        <input type="hidden" value={projectId} {...register("project_id")} />

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">إجمالي البنك للفترة</div>
              <div className="text-xs text-gray-500">LYD</div>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full border rounded px-3 py-2 text-left"
              {...register("totals.bank", { valueAsNumber: true })}
            />
            {errors.totals?.bank && (
              <div className="mt-1 text-xs text-error">
                {errors.totals.bank.message as string}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              المتبقي: {formatCurrency(remaining.bank, "LYD")}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">إجمالي النقد للفترة</div>
              <div className="text-xs text-gray-500">LYD</div>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full border rounded px-3 py-2 text-left"
              {...register("totals.cash", { valueAsNumber: true })}
            />
            {errors.totals?.cash && (
              <div className="mt-1 text-xs text-error">
                {errors.totals.cash.message as string}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              المتبقي: {formatCurrency(remaining.cash, "LYD")}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600">المعيّن من البنك</div>
            <div
              className={`mt-1 text-lg font-semibold ${
                totalsAssigned.bankUsed > (totals?.bank || 0)
                  ? "text-error"
                  : "text-primary"
              }`}
            >
              {formatCurrency(totalsAssigned.bankUsed, "LYD")}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600">المعيّن من النقد</div>
            <div
              className={`mt-1 text-lg font-semibold ${
                totalsAssigned.cashUsed > (totals?.cash || 0)
                  ? "text-error"
                  : "text-primary"
              }`}
            >
              {formatCurrency(totalsAssigned.cashUsed, "LYD")}
            </div>
          </div>
        </div>

        {/* Employees distribution list */}
        <div className="space-y-4 mb-8">
          <div className="divide-y divide-gray-200 border rounded-lg">
            {assignments.map((a, idx) => {
              const fullName =
                `${a.employees?.first_name ?? ""} ${a.employees?.last_name ?? ""}`.trim() ||
                a.user_id;

              const empErrors = errors.employees?.[idx];
              return (
                <div key={a.user_id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{fullName}</div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={samePercentage[a.user_id] ?? true}
                        onChange={(e) =>
                          setSamePercentage((prev) => ({
                            ...prev,
                            [a.user_id]: e.target.checked,
                          }))
                        }
                      />
                      نفس النسبة للبنك والنقد
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="font-semibold mb-2">بنك</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            النسبة %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            className="w-full border rounded px-3 py-2 text-left"
                            {...register(`employees.${idx}.bank.percentage`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.bank?.percentage && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.bank.percentage.message as string}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            المبلغ
                          </label>
                          <input
                            type="number"
                            readOnly
                            className="w-full border rounded px-3 py-2 bg-gray-100 text-left"
                            {...register(`employees.${idx}.bank.amount`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            موقوف
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="w-full border rounded px-3 py-2 text-left"
                            {...register(`employees.${idx}.bank.held`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.bank?.held && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.bank.held.message as string}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            خصم
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="w-full border rounded px-3 py-2 text-left"
                            {...register(`employees.${idx}.bank.discount`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.bank?.discount && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.bank.discount.message as string}
                            </div>
                          )}
                        </div>
                      </div>

                      <label className="block text-xs text-gray-600 mb-1">
                        ملاحظة
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-left"
                        {...register(`employees.${idx}.bank.note`)}
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="font-semibold mb-2">نقد</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            النسبة %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            className="w-full border rounded px-3 py-2 text-left"
                            disabled={samePercentage[a.user_id]}
                            {...register(`employees.${idx}.cash.percentage`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.cash?.percentage && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.cash.percentage.message as string}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            المبلغ
                          </label>
                          <input
                            type="number"
                            readOnly
                            className="w-full border rounded px-3 py-2 bg-gray-100 text-left"
                            {...register(`employees.${idx}.cash.amount`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            موقوف
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="w-full border rounded px-3 py-2 text-left"
                            {...register(`employees.${idx}.cash.held`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.cash?.held && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.cash.held.message as string}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            خصم
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            className="w-full border rounded px-3 py-2 text-left"
                            {...register(`employees.${idx}.cash.discount`, {
                              valueAsNumber: true,
                            })}
                          />
                          {empErrors?.cash?.discount && (
                            <div className="mt-1 text-xs text-error">
                              {empErrors.cash.discount.message as string}
                            </div>
                          )}
                        </div>
                      </div>

                      <label className="block text-xs text-gray-600 mb-1">
                        ملاحظة
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-left"
                        {...register(`employees.${idx}.cash.note`)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      ملاحظة عامة للموظف
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-left"
                      {...register(`employees.${idx}.note`)}
                    />
                    {empErrors?.note && (
                      <div className="mt-1 text-xs text-error">
                        {empErrors.note.message as string}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                حصة الشركة (بنك)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full border rounded px-3 py-2 text-left"
                {...register("company.bank", { valueAsNumber: true })}
              />
              {errors.company?.bank && (
                <div className="mt-1 text-xs text-red-600">
                  {errors.company.bank.message as string}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                حصة الشركة (نقد)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full border rounded px-3 py-2 text-left"
                {...register("company.cash", { valueAsNumber: true })}
              />
              {errors.company?.cash && (
                <div className="mt-1 text-xs text-red-600">
                  {errors.company.cash.message as string}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </form>
    </div>
  );
};

export default ProjectPercentageDistributionForm;
