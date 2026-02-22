import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency, formatDate } from "../../../utils/helpper";
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

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepBar = ({ step }: { step: 1 | 2 }) => (
  <div className="flex items-center gap-3 mb-6">
    {[
      { n: 1, label: "اختيار السجلات" },
      { n: 2, label: "توزيع النسب" },
    ].map(({ n, label }, i) => (
      <div key={n} className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= n ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {n}
          </div>
          <span
            className={`text-sm font-medium ${
              step >= n ? "text-blue-700" : "text-gray-400"
            }`}
          >
            {label}
          </span>
        </div>
        {i === 0 && (
          <div
            className={`h-0.5 w-12 transition-colors ${
              step === 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const ProjectPercentageDistributionForm = ({
  projectId,
}: ProjectPercentageDistributionFormProps) => {
  // ── step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

  // ── form / submission state ─────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { PercentageDistribution } = usePayroll();

  // ── data ────────────────────────────────────────────────────────────────────
  const {
    error,
    loading: projectLoading,
    project,
  } = useProjectWithAssignments(projectId);

  // Available cash / bank from project_percentage
  const cashPercentage = project?.project_percentage?.find(
    (pp) => pp.type === "cash",
  );
  const bankPercentage = project?.project_percentage?.find(
    (pp) => pp.type === "bank",
  );
  const totalCashAvailable = cashPercentage?.period_percentage ?? 0;
  const totalBankAvailable = bankPercentage?.period_percentage ?? 0;

  // ── log helpers ─────────────────────────────────────────────────────────────
  const logs = project?.project_percentage_log ?? [];

  const selectedLogs = useMemo(
    () => logs.filter((l) => selectedLogIds.has(l.id)),
    [logs, selectedLogIds],
  );

  // Total amount coming from the selected logs
  const selectedTotal = useMemo(
    () => selectedLogs.reduce((s, l) => s + (l.amount ?? 0), 0),
    [selectedLogs],
  );

  // We split selected total proportionally by cash/bank availability
  const totalPool = totalCashAvailable + totalBankAvailable;
  const selectedCash =
    totalPool > 0 ? (selectedTotal * totalCashAvailable) / totalPool : 0;
  const selectedBank =
    totalPool > 0 ? (selectedTotal * totalBankAvailable) / totalPool : 0;

  // Guard: selected total must not exceed available pool
  const selectionExceedsPool = selectedTotal > totalPool;

  const toggleLog = (id: string) =>
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selectedLogIds.size === logs.length) setSelectedLogIds(new Set());
    else setSelectedLogIds(new Set(logs.map((l) => l.id)));
  };

  // ── react-hook-form ─────────────────────────────────────────────────────────
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
      // log_ids must be here so RHF registers the field — Zod sees undefined otherwise
      log_ids: [],
      selected_cash: 0,
      selected_bank: 0,
    },
  });

  // Sync selectedLogIds + computed cash/bank amounts into RHF so the function
  // receives the already-calculated values instead of re-deriving from DB.
  useEffect(() => {
    setValue("log_ids", Array.from(selectedLogIds));
    setValue("selected_cash", selectedCash);
    setValue("selected_bank", selectedBank);
  }, [selectedLogIds, selectedCash, selectedBank, setValue]);

  const { fields } = useFieldArray({ control, name: "employee" });

  // Initialise employee rows from project assignments
  useEffect(() => {
    if (project?.project_assignments) {
      const companyPct = project.project_assignments.reduce(
        (s, p) => s + p.percentage,
        0,
      );
      reset({
        project_id: project.id,
        employee: project.project_assignments.map((pa) => ({
          employee_id: pa.user_id,
          percentage: pa.percentage,
          CashAmount: 0,
          BankAmount: 0,
          cash_held: 0,
          bank_held: 0,
          discount: 0,
          total: 0,
          note: "",
        })),
        company: {
          percentage: 100 - companyPct,
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

  // Recalculate amounts for employees whenever selection or inputs change
  useEffect(() => {
    if (!watchEmployees) return;
    watchEmployees.forEach((emp, index) => {
      const pct = emp.percentage ?? 0;
      const cash = (selectedCash * pct) / 100;
      const bank = (selectedBank * pct) / 100;
      const total =
        cash -
        (emp.cash_held ?? 0) +
        (bank - (emp.bank_held ?? 0)) -
        (emp.discount ?? 0);
      setValue(`employee.${index}.CashAmount`, cash);
      setValue(`employee.${index}.BankAmount`, bank);
      setValue(`employee.${index}.total`, total);
    });
  }, [
    watchEmployees?.map((e) => e.percentage).join(","),
    watchEmployees?.map((e) => e.cash_held).join(","),
    watchEmployees?.map((e) => e.bank_held).join(","),
    watchEmployees?.map((e) => e.discount).join(","),
    selectedCash,
    selectedBank,
    setValue,
  ]);

  // Recalculate company amounts
  useEffect(() => {
    if (!watchCompany) return;
    const pct = watchCompany.percentage ?? 0;
    const cash = (selectedCash * pct) / 100;
    const bank = (selectedBank * pct) / 100;
    const total =
      cash -
      (watchCompany.cash_held ?? 0) +
      (bank - (watchCompany.bank_held ?? 0)) -
      (watchCompany.discount ?? 0);
    setValue("company.CashAmount", cash);
    setValue("company.BankAmount", bank);
    setValue("company.total", total);
  }, [
    watchCompany?.percentage,
    watchCompany?.cash_held,
    watchCompany?.bank_held,
    watchCompany?.discount,
    selectedCash,
    selectedBank,
    setValue,
  ]);

  // Percentage totals
  const employeeTotalPct =
    watchEmployees?.reduce((s, e) => s + (e.percentage ?? 0), 0) ?? 0;
  const companyPct = watchCompany?.percentage ?? 0;
  const grandTotalPct = employeeTotalPct + companyPct;
  const remainingPct = 100 - grandTotalPct;

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleFormSubmit = handleSubmit(
    async (data: PercentageDistributionFormValues) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        // log_ids is already in data — it's synced from selectedLogIds via setValue
        const result = await PercentageDistribution(data);
        if (!result.success) {
          setErrorMessage(result.message ?? "حدث خطأ أثناء حفظ التوزيع");
        } else {
          setSuccess("تم حفظ توزيع نسب المشروع بنجاح");
          setErrorMessage(null);
        }
      } catch (e) {
        console.error(e);
        setErrorMessage("حدث خطأ أثناء حفظ التوزيع");
      } finally {
        setLoading(false);
      }
    },
    // onInvalid: fires when Zod/RHF validation fails so the button is not silent
    (validationErrors) => {
      console.error("Form validation errors:", validationErrors);

      const fieldLabel: Record<string, string> = {
        percentage: "النسبة",
        cash_held: "النقدي المحجوز",
        bank_held: "البنك المحجوز",
        discount: "الخصم",
        employee_id: "معرّف الموظف",
        CashAmount: "النقدي",
        BankAmount: "البنك",
        total: "الإجمالي",
        note: "ملاحظات",
        project_id: "معرّف المشروع",
      };

      const messages: string[] = [];

      if (validationErrors.project_id) {
        messages.push(
          `• معرّف المشروع: ${(validationErrors.project_id as { message?: string }).message ?? "مطلوب"}`,
        );
      }

      if (Array.isArray(validationErrors.employee)) {
        (
          validationErrors.employee as Array<
            Record<string, { message?: string }> | undefined
          >
        ).forEach((empErr, i) => {
          if (!empErr) return;
          const pa = project?.project_assignments?.[i];
          const name = pa
            ? `${pa.employees?.first_name ?? ""} ${pa.employees?.last_name ?? ""}`.trim() ||
              `موظف ${i + 1}`
            : `موظف ${i + 1}`;
          Object.entries(empErr).forEach(([field, err]) => {
            const e = err as { message?: string };
            if (e?.message) {
              messages.push(
                `• ${name} — ${fieldLabel[field] ?? field}: ${e.message}`,
              );
            }
          });
        });
      }

      if (validationErrors.company) {
        const co = validationErrors.company as Record<
          string,
          { message?: string }
        >;
        Object.entries(co).forEach(([field, err]) => {
          const e = err as { message?: string };
          if (e?.message) {
            messages.push(
              `• الشركة — ${fieldLabel[field] ?? field}: ${e.message}`,
            );
          }
        });
      }

      if (validationErrors.total) {
        messages.push(
          `• الإجمالي: ${(validationErrors.total as { message?: string }).message ?? "خطأ"}`,
        );
      }

      setErrorMessage(
        `يوجد أخطاء في النموذج:
${messages.length > 0 ? messages.join("\n") : "يرجى مراجعة جميع الحقول."}`,
      );
    },
  );

  // ── guards ──────────────────────────────────────────────────────────────────
  if (projectLoading) return <LoadingPage />;
  if (error)
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المشروع"
        error={error.message}
      />
    );
  if (!project)
    return <div className="text-center p-6">المشروع غير موجود.</div>;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-1 text-gray-800">
          توزيع نسب المشروع
        </h1>
        <div className="text-lg text-gray-600 mb-4">
          <span className="font-semibold">{project.name}</span>
          <span className="text-sm mr-2">({project.code})</span>
        </div>

        <StepBar step={step} />

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 font-medium mb-1">
              النقدي المتاح (الكلي)
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalCashAvailable, "LYD")}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
            <div className="text-sm text-green-700 font-medium mb-1">
              البنك المتاح (الكلي)
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalBankAvailable, "LYD")}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700 font-medium mb-1">
              المجموع المتاح (الكلي)
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(totalPool, "LYD")}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STEP 1 — Log selection
      ════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">
                اختر السجلات للتوزيع
              </h2>
              {logs.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedLogIds.size === logs.length
                    ? "إلغاء تحديد الكل"
                    : "تحديد الكل"}
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-lg">لا توجد سجلات غير موزعة لهذا المشروع</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const checked = selectedLogIds.has(log.id);
                  return (
                    <label
                      key={log.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        checked
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLog(log.id)}
                        className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* Date */}
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">
                            التاريخ
                          </div>
                          <div className="text-sm font-medium text-gray-800">
                            {formatDate(log.created_at ?? "")}
                          </div>
                        </div>

                        {/* Expense name */}
                        <div className="md:col-span-2">
                          <div className="text-xs text-gray-500 mb-0.5">
                            {log.project_expenses ? "المصروف" : "الدفعة"}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {log.project_expenses
                              ? (log.project_expenses.description ??
                                log.project_expenses.description ??
                                "—")
                              : log.expense_payments
                                ? `دفعة #${log.expense_payments.serial_number ?? log.payment_id?.slice(0, 8)}`
                                : "—"}
                          </div>
                          {/* Sub-label: total_amount or payment amount */}
                          {log.project_expenses && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              إجمالي المصروف:{" "}
                              {formatCurrency(
                                log.project_expenses.total_amount,
                                "LYD",
                              )}
                            </div>
                          )}
                          {log.expense_payments && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              مبلغ الدفعة:{" "}
                              {formatCurrency(
                                log.expense_payments.amount,
                                "LYD",
                              )}
                            </div>
                          )}
                        </div>

                        {/* Log amount (the percentage slice) */}
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">
                            مبلغ النسبة
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(log.amount, "LYD")}
                          </div>
                        </div>

                        {/* Percentage */}
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">
                            النسبة
                          </div>
                          <div className="text-sm font-medium text-indigo-700">
                            {log.percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Checkmark badge */}
                      {checked && (
                        <div className="text-blue-600 font-bold text-lg">✓</div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selection summary & validation */}
          {selectedLogIds.size > 0 && (
            <div
              className={`p-5 rounded-lg border-2 ${
                selectionExceedsPool
                  ? "bg-red-50 border-red-300"
                  : "bg-emerald-50 border-emerald-300"
              }`}
            >
              <h3 className="font-bold text-gray-800 mb-3 text-lg">
                ملخص التحديد
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    عدد السجلات المحددة
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    {selectedLogIds.size}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    إجمالي المبالغ المحددة
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      selectionExceedsPool ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(selectedTotal, "LYD")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    نقدي للتوزيع (تقريبي)
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    {formatCurrency(selectedCash, "LYD")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    بنك للتوزيع (تقريبي)
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    {formatCurrency(selectedBank, "LYD")}
                  </div>
                </div>
              </div>

              {selectionExceedsPool && (
                <div className="text-red-700 text-sm font-semibold">
                  ⚠️ مجموع السجلات المحددة (
                  {formatCurrency(selectedTotal, "LYD")}) يتجاوز المبلغ المتاح (
                  {formatCurrency(totalPool, "LYD")}). يرجى إلغاء تحديد بعض
                  السجلات.
                </div>
              )}
            </div>
          )}

          {/* Next step button */}
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedLogIds.size === 0 || selectionExceedsPool}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg shadow-md"
            >
              التالي: توزيع النسب ←
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STEP 2 — Distribution form
      ════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Selected logs recap */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                السجلات المختارة للتوزيع
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                ← تعديل التحديد
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedLogs.map((log) => (
                <div
                  key={log.id}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  <span>{formatDate(log.created_at ?? "")} - </span>
                  <span className="font-bold">
                    {formatCurrency(log.amount, "LYD")}
                  </span>
                </div>
              ))}
            </div>

            {/* Distributable amounts derived from selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-1">
                  النقدي للتوزيع
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(selectedCash, "LYD")}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">
                  البنك للتوزيع
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(selectedBank, "LYD")}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-700 font-medium mb-1">
                  الإجمالي للتوزيع
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(selectedTotal, "LYD")}
                </div>
              </div>
            </div>

            {/* Percentage used bar */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-amber-800">
                    النسبة المستخدمة:
                  </span>
                  <span
                    className={`text-xl font-bold mr-2 ${
                      grandTotalPct > 100 ? "text-red-600" : "text-amber-900"
                    }`}
                  >
                    {grandTotalPct.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-sm text-amber-800">المتبقي:</span>
                  <span
                    className={`text-xl font-bold mr-2 ${
                      remainingPct < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {remainingPct.toFixed(2)}%
                  </span>
                </div>
              </div>
              {grandTotalPct > 100 && (
                <div className="mt-2 text-sm text-red-600 font-medium">
                  ⚠️ تحذير: النسبة الإجمالية تتجاوز 100%
                </div>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {success && (
            <div className="p-4 rounded-lg bg-green-100 text-green-800 border border-green-300">
              ✓ {success}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-300 text-right">
              <div className="font-semibold mb-1">✗ خطأ في الحفظ</div>
              <div className="text-sm space-y-0.5 whitespace-pre-line">
                {errorMessage}
              </div>
            </div>
          )}

          {/* ── Employees ─────────────────────────────────────────────────── */}
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
                  const assignment = project.project_assignments[index];
                  const empData = watchEmployees?.[index];

                  return (
                    <div
                      key={field.id}
                      className="bg-gray-50 rounded-lg p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {assignment.employees?.first_name}{" "}
                          {assignment.employees?.last_name}
                        </h3>
                        <div className="text-sm text-gray-500 font-mono">
                          {assignment.user_id.slice(0, 8)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="flex flex-col">
                          <label className="mb-1 text-sm font-medium text-gray-700">
                            النسبة (%)
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

                      {/* Computed amounts */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-300">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">نقدي</div>
                          <div className="text-sm font-bold text-blue-900">
                            {formatCurrency(empData?.CashAmount ?? 0, "LYD")}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-xs text-green-600 mb-1">بنك</div>
                          <div className="text-sm font-bold text-green-900">
                            {formatCurrency(empData?.BankAmount ?? 0, "LYD")}
                          </div>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <div className="text-xs text-amber-600 mb-1">
                            نقدي محجوز
                          </div>
                          <div className="text-sm font-bold text-amber-900">
                            {formatCurrency(empData?.cash_held ?? 0, "LYD")}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-xs text-orange-600 mb-1">
                            بنك محجوز
                          </div>
                          <div className="text-sm font-bold text-orange-900">
                            {formatCurrency(empData?.bank_held ?? 0, "LYD")}
                          </div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-xs text-red-600 mb-1">خصم</div>
                          <div className="text-sm font-bold text-red-900">
                            {formatCurrency(empData?.discount ?? 0, "LYD")}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-xs text-purple-600 mb-1">
                            الإجمالي
                          </div>
                          <div className="text-sm font-bold text-purple-900">
                            {formatCurrency(empData?.total ?? 0, "LYD")}
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

          {/* ── Company ───────────────────────────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
              حصة الشركة
            </h2>
            <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    النسبة (%)
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
                    {formatCurrency(watchCompany?.CashAmount ?? 0, "LYD")}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">بنك</div>
                  <div className="text-sm font-bold text-green-900">
                    {formatCurrency(watchCompany?.BankAmount ?? 0, "LYD")}
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-amber-600 mb-1">نقدي محجوز</div>
                  <div className="text-sm font-bold text-amber-900">
                    {formatCurrency(watchCompany?.cash_held ?? 0, "LYD")}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-orange-600 mb-1">بنك محجوز</div>
                  <div className="text-sm font-bold text-orange-900">
                    {formatCurrency(watchCompany?.bank_held ?? 0, "LYD")}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-red-600 mb-1">خصم</div>
                  <div className="text-sm font-bold text-red-900">
                    {formatCurrency(watchCompany?.discount ?? 0, "LYD")}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-purple-600 mb-1">الإجمالي</div>
                  <div className="text-sm font-bold text-purple-900">
                    {formatCurrency(watchCompany?.total ?? 0, "LYD")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation banner */}
          {grandTotalPct !== 100 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-right">
              <div className="text-red-800 font-semibold mb-1">
                ⚠️ لا يمكن الحفظ - يجب أن يكون الإجمالي 100% بالضبط
              </div>
              <div className="text-red-700 text-sm">
                {grandTotalPct > 100
                  ? `الإجمالي الحالي: ${grandTotalPct.toFixed(2)}% (زيادة ${(grandTotalPct - 100).toFixed(2)}%)`
                  : `الإجمالي الحالي: ${grandTotalPct.toFixed(2)}% (نقص ${(100 - grandTotalPct).toFixed(2)}%)`}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              ← رجوع
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={loading || grandTotalPct !== 100}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg shadow-md"
            >
              {loading ? "جاري الحفظ..." : "حفظ التوزيع"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPercentageDistributionForm;
