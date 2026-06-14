import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  DistributionPeriod,
  useDistributionHistory,
} from "../../hooks/projects/useDistributionHistory";
import { formatCurrency } from "../../utils/helpper";
import { supabase } from "../../lib/supabaseClient";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import ReverseDistributionDialog from "../../components/company/ReverseDistributionDialog";

type Currency = "LYD" | "USD" | "EUR";
const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

// ─── Per-currency card (cash + bank merged) ───────────────────────────────────

function CurrencyCard({
  currency,
  periods,
  onReverse,
}: {
  currency: Currency;
  periods: DistributionPeriod[];
  onReverse: (period: DistributionPeriod) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const relevant = periods.filter((p) => p.currency === currency);
  if (relevant.length === 0) return null;

  const activePeriods = relevant.filter((p) => p.status !== "reversed");
  const hasReversed = relevant.some((p) => p.status === "reversed");

  // Active totals only for the summary
  const totalAmount = activePeriods.reduce(
    (s, p) => s + Number(p.total_amount),
    0,
  );
  const cashTotal = activePeriods.reduce(
    (s, p) =>
      s +
      p.items
        .filter((i) => i.item_type === "employee")
        .reduce((a, i) => a + i.cash_amount, 0),
    0,
  );
  const bankTotal = activePeriods.reduce(
    (s, p) =>
      s +
      p.items
        .filter((i) => i.item_type === "employee")
        .reduce((a, i) => a + i.bank_amount, 0),
    0,
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-700">{currency}</span>
          {hasReversed && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              يحتوي معكوس
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-gray-800 tabular-nums">
            {formatCurrency(totalAmount, currency)}
          </span>
          <span
            className={`text-gray-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Cash / Bank employee split summary (active only) */}
      <div className="flex border-t divide-x divide-x-reverse bg-gray-50">
        <div className="flex-1 px-5 py-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">نقد (موظفين)</p>
          <p className="font-semibold text-gray-700 tabular-nums text-sm">
            {formatCurrency(cashTotal, currency)}
          </p>
        </div>
        <div className="flex-1 px-5 py-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">بنك (موظفين)</p>
          <p className="font-semibold text-gray-700 tabular-nums text-sm">
            {formatCurrency(bankTotal, currency)}
          </p>
        </div>
      </div>

      {/* Expanded: per-period breakdown */}
      {expanded && (
        <div className="border-t divide-y">
          {relevant.map((period) => {
            const isReversed = period.status === "reversed";

            const employeeItems = period.items.filter(
              (i) => i.item_type === "employee",
            );
            const bankItem = period.items.find((i) => i.item_type === "bank");
            const companyItem = period.items.find(
              (i) => i.item_type === "company",
            );

            // Per-period employee cash/bank totals
            const periodCash = employeeItems.reduce(
              (s, i) => s + i.cash_amount,
              0,
            );
            const periodBank = employeeItems.reduce(
              (s, i) => s + i.bank_amount,
              0,
            );

            return (
              <div
                key={period.id}
                className={`px-5 py-4 space-y-3 ${
                  isReversed ? "opacity-60 bg-red-50" : ""
                }`}
              >
                {/* Period meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        period.type === "cash"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {period.type === "cash" ? "نقد" : "بنك"}
                    </span>
                    {isReversed ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        ✕ معكوس
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ● نشط
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-gray-800">
                    {formatCurrency(Number(period.total_amount), currency)}
                  </span>
                </div>

                {/* Cash + Bank employee mini-summary */}
                {!isReversed && (
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-center">
                      <p className="text-xs text-gray-400">نقد</p>
                      <p className="text-sm font-semibold tabular-nums text-amber-700">
                        {formatCurrency(periodCash, currency)}
                      </p>
                    </div>
                    <div className="flex-1 rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-center">
                      <p className="text-xs text-gray-400">بنك</p>
                      <p className="text-sm font-semibold tabular-nums text-blue-700">
                        {formatCurrency(periodBank, currency)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reversal note */}
                {isReversed && period.reversal_note && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    <span className="font-semibold">سبب الإلغاء: </span>
                    {period.reversal_note}
                  </div>
                )}

                {/* Distribution breakdown table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-right text-gray-400 bg-gray-50">
                      <th className="px-2 py-1.5">الجهة</th>
                      <th className="px-2 py-1.5">النسبة</th>
                      <th className="px-2 py-1.5">نقد</th>
                      <th className="px-2 py-1.5">بنك</th>
                      <th className="px-2 py-1.5">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bankItem && (
                      <tr className="bg-yellow-50 text-right">
                        <td className="px-2 py-1.5 font-medium">
                          🏦 الاحتياطي
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {bankItem.percentage}%
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(bankItem.cash_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(bankItem.bank_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums font-semibold">
                          {formatCurrency(bankItem.total, currency)}
                        </td>
                      </tr>
                    )}
                    {companyItem && (
                      <tr className="bg-green-50 text-right">
                        <td className="px-2 py-1.5 font-medium">🏢 الشركة</td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {companyItem.percentage}%
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(companyItem.cash_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(companyItem.bank_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums font-semibold">
                          {formatCurrency(companyItem.total, currency)}
                        </td>
                      </tr>
                    )}
                    {employeeItems.map((item) => (
                      <tr key={item.id} className="text-right">
                        <td className="px-2 py-1.5 font-medium">
                          👤 {item.employee_name ?? item.user_id ?? "—"}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {item.percentage}%
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(item.cash_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatCurrency(item.bank_amount, currency)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums font-semibold">
                          {formatCurrency(item.total, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Per-period reverse button */}
                {!isReversed && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onReverse(period)}
                      className="text-xs text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                      عكس هذه الفترة
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reverse-all confirmation dialog ─────────────────────────────────────────

function ReverseAllDialog({
  projectName,
  activePeriodCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  projectName: string;
  activePeriodCount: number;
  onConfirm: (note: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        dir="rtl"
      >
        <div className="bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-base font-bold text-red-700">
              عكس جميع فترات المشروع
            </h2>
            <p className="text-xs text-red-500 mt-0.5">
              سيتم عكس {activePeriodCount} فترة نشطة — لا يمكن التراجع
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">المشروع</span>
              <span className="font-medium">{projectName}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">الفترات النشطة</span>
              <span className="font-medium">{activePeriodCount}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              سبب الإلغاء <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="أدخل سبب عكس جميع التوزيعات..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          </div>
        </div>

        <div className="border-t px-5 py-3 flex gap-2 justify-between bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isSubmitting || note.trim().length < 3}
            className={[
              "px-4 py-2 rounded-md text-sm text-white font-medium",
              isSubmitting || note.trim().length < 3
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700",
            ].join(" ")}
          >
            {isSubmitting ? "جاري الإلغاء..." : "تأكيد عكس الكل"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProjectDistributionDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const batchDate = searchParams.get("date");
  const navigate = useNavigate();

  const {
    periods: allPeriods,
    loading,
    error,
    reverseDistribution,
  } = useDistributionHistory();

  const [projectName, setProjectName] = useState<string>("");
  const [reversalTarget, setReversalTarget] =
    useState<DistributionPeriod | null>(null);
  const [showReverseAll, setShowReverseAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    supabase
      .from("projects")
      .select("name, serial_number")
      .eq("id", projectId)
      .single()
      .then(({ data }) => {
        if (data)
          setProjectName(
            data.serial_number
              ? `#${data.serial_number} ${data.name}`
              : data.name,
          );
      });
  }, [projectId]);

  // Reverse a single period
  const handleReverse = async (note: string) => {
    if (!reversalTarget) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.alert("لم يتم التعرف على المستخدم");
      return;
    }
    setIsSubmitting(true);
    const result = await reverseDistribution(reversalTarget, user.id, note);
    setIsSubmitting(false);
    if (!result.success) {
      window.alert(`حدث خطأ: ${result.error}`);
      return;
    }
    setReversalTarget(null);
    window.alert("تم عكس التوزيع بنجاح");
  };

  // Reverse ALL active periods for this project in this batch
  const handleReverseAll = async (note: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.alert("لم يتم التعرف على المستخدم");
      return;
    }
    setIsSubmitting(true);
    for (const period of activePeriods) {
      const result = await reverseDistribution(period, user.id, note);
      if (!result.success) {
        setIsSubmitting(false);
        window.alert(`حدث خطأ أثناء عكس الفترة: ${result.error}`);
        return;
      }
    }
    setIsSubmitting(false);
    setShowReverseAll(false);
    window.alert("تم عكس جميع التوزيعات بنجاح");
  };

  if (loading) return <LoadingPage label="جاري تحميل بيانات المشروع" />;
  if (error)
    return (
      <ErrorPage error={error.message || "حدث خطأ"} label="تفاصيل التوزيع" />
    );

  const periods = (allPeriods ?? []).filter(
    (p) =>
      p.project.id === projectId && (!batchDate || p.end_date === batchDate),
  );

  const activePeriods = periods.filter((p) => p.status !== "reversed");

  // Grand totals — active only
  const grandTotals: Record<string, number> = {};
  for (const p of activePeriods) {
    const c = p.currency ?? "LYD";
    grandTotals[c] = (grandTotals[c] ?? 0) + Number(p.total_amount);
  }

  const activeCurrencies = CURRENCIES.filter((c) => (grandTotals[c] ?? 0) > 0);

  return (
    <div className="p-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
        >
          ‹ رجوع
        </button>

        {/* Project header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {projectName || "..."}
            </h1>
            {batchDate && (
              <p className="text-sm text-gray-400 mt-0.5">دفعة {batchDate}</p>
            )}
          </div>

          {/* Reverse all button — only if there are active periods */}
          {activePeriods.length > 0 && (
            <button
              onClick={() => setShowReverseAll(true)}
              className="shrink-0 text-xs text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-md transition-colors"
            >
              ↩ عكس جميع الفترات
            </button>
          )}
        </div>

        {/* Currency totals summary strip (active only) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {CURRENCIES.map((c) => (
            <div
              key={c}
              className={`rounded-xl border px-4 py-3 text-center ${
                (grandTotals[c] ?? 0) > 0
                  ? "bg-white shadow-sm"
                  : "bg-gray-50 opacity-50"
              }`}
            >
              <p className="text-xs text-gray-400 mb-1">{c}</p>
              <p
                className={`font-bold tabular-nums text-sm ${
                  (grandTotals[c] ?? 0) > 0 ? "text-gray-800" : "text-gray-300"
                }`}
              >
                {formatCurrency(grandTotals[c] ?? 0, c)}
              </p>
            </div>
          ))}
        </div>

        {/* Per-currency expandable cards */}
        {periods.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            لا توجد توزيعات لهذا المشروع في هذه الدفعة
          </div>
        ) : (
          <div className="space-y-4">
            {(activeCurrencies.length > 0 ? activeCurrencies : CURRENCIES).map(
              (c) => (
                <CurrencyCard
                  key={c}
                  currency={c}
                  periods={periods}
                  onReverse={setReversalTarget}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Single-period reverse dialog */}
      {reversalTarget && (
        <ReverseDistributionDialog
          period={reversalTarget}
          onConfirm={handleReverse}
          onCancel={() => setReversalTarget(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Reverse-all dialog */}
      {showReverseAll && (
        <ReverseAllDialog
          projectName={projectName}
          activePeriodCount={activePeriods.length}
          onConfirm={handleReverseAll}
          onCancel={() => setShowReverseAll(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default ProjectDistributionDetailPage;
