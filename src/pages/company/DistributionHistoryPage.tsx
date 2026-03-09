import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import {
  useDistributionHistory,
  DistributionPeriod,
} from "../../hooks/projects/useDistributionHistory";
import ReverseDistributionDialog from "../../components/company/ReverseDistributionDialog";
import { formatCurrency } from "../../utils/helpper";

type Currency = "LYD" | "USD" | "EUR";

const DistributionHistoryPage = () => {
  const { periods, loading, error, reverseDistribution } =
    useDistributionHistory();

  const [openId, setOpenId] = useState<string | null>(null);
  const [reversalTarget, setReversalTarget] =
    useState<DistributionPeriod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "reversed"
  >("all");
  const [filterProject, setFilterProject] = useState<string>("");

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
    window.alert("تم عكس التوزيع بنجاح واسترداد جميع الأرصدة");
  };

  if (loading) return <LoadingPage label="جاري تحميل سجل التوزيعات" />;
  if (error)
    return (
      <ErrorPage
        error={error.message || "حدث خطأ أثناء تحميل السجل"}
        label="سجل التوزيعات"
      />
    );

  const safePeriods = periods ?? [];

  // Unique project names for filter dropdown
  const projectNames = Array.from(
    new Set(safePeriods.map((p) => p.project.name)),
  ).sort();

  const filtered = safePeriods.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterProject && p.project.name !== filterProject) return false;
    return true;
  });

  return (
    <div className="p-4" dir="rtl">
      {/* Page header */}
      <div className="max-w-5xl mx-auto mb-4">
        <h1 className="text-2xl font-bold text-gray-800">سجل التوزيعات</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          عرض جميع فترات التوزيع مع إمكانية عكس أي توزيع نشط
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "all" | "active" | "reversed")
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="reversed">معكوس</option>
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px]"
        >
          <option value="">كل المشاريع</option>
          {projectNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-400 self-center">
          {filtered.length} فترة
        </span>
      </div>

      {/* Table */}
      <div className="max-w-5xl mx-auto overflow-x-auto rounded-md border bg-white">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            لا توجد توزيعات تطابق الفلتر
          </div>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-right">
                <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  المشروع
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  الفترة
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  العملة
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">النوع</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  الإجمالي
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  الحالة
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">إجراء</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filtered.map((period, index) => {
                const isOpen = openId === period.id;
                const currency = period.currency as Currency;

                return (
                  <>
                    <tr
                      key={period.id}
                      className={`hover:bg-gray-50 ${
                        period.status === "reversed" ? "opacity-60" : ""
                      } ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {period.project.serial_number
                          ? `#${period.project.serial_number} `
                          : ""}
                        {period.project.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums whitespace-nowrap text-xs">
                        {period.start_date} → {period.end_date}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{currency}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {period.type === "cash" ? "نقد" : "بنك"}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-gray-800">
                        {formatCurrency(period.total_amount, currency)}
                      </td>
                      <td className="px-4 py-3">
                        {period.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            ● نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            ✕ معكوس
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Expand details */}
                          <button
                            onClick={() =>
                              setOpenId((p) =>
                                p === period.id ? null : period.id,
                              )
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {isOpen ? "إخفاء" : "تفاصيل"}
                          </button>

                          {/* Reverse button — only for active */}
                          {period.status === "active" && (
                            <button
                              onClick={() => setReversalTarget(period)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              عكس
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isOpen && (
                      <tr key={`${period.id}-detail`}>
                        <td colSpan={8} className="px-4 py-3 bg-blue-50">
                          <div className="rounded-md border bg-white p-4 space-y-3">
                            {/* Reversal note if reversed */}
                            {period.status === "reversed" &&
                              period.reversal_note && (
                                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                                  <span className="font-semibold">
                                    سبب الإلغاء:{" "}
                                  </span>
                                  {period.reversal_note}
                                  {period.reversed_at && (
                                    <span className="text-red-400 mr-2">
                                      (
                                      {new Date(
                                        period.reversed_at,
                                      ).toLocaleDateString("ar")}
                                      )
                                    </span>
                                  )}
                                </div>
                              )}

                            {/* Items breakdown */}
                            <p className="text-xs font-semibold text-gray-600">
                              تفاصيل التوزيع
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-right text-gray-500 bg-gray-50">
                                  <th className="px-2 py-1">الجهة</th>
                                  <th className="px-2 py-1">النسبة %</th>
                                  <th className="px-2 py-1">نقد</th>
                                  <th className="px-2 py-1">بنك</th>
                                  <th className="px-2 py-1">الإجمالي</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {period.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className={`text-right ${
                                      item.item_type === "bank"
                                        ? "bg-yellow-50"
                                        : item.item_type === "company"
                                          ? "bg-green-50"
                                          : ""
                                    }`}
                                  >
                                    <td className="px-2 py-1 font-medium">
                                      {item.item_type === "bank"
                                        ? "🏦 الاحتياطي"
                                        : item.item_type === "company"
                                          ? "🏢 الشركة"
                                          : `👤 ${item.employee_name ?? item.user_id}`}
                                    </td>
                                    <td className="px-2 py-1 tabular-nums">
                                      {item.percentage}%
                                    </td>
                                    <td className="px-2 py-1 tabular-nums">
                                      {formatCurrency(
                                        item.cash_amount,
                                        currency,
                                      )}
                                    </td>
                                    <td className="px-2 py-1 tabular-nums">
                                      {formatCurrency(
                                        item.bank_amount,
                                        currency,
                                      )}
                                    </td>
                                    <td className="px-2 py-1 tabular-nums font-semibold">
                                      {formatCurrency(item.total, currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reversal dialog */}
      {reversalTarget && (
        <ReverseDistributionDialog
          period={reversalTarget}
          onConfirm={handleReverse}
          onCancel={() => setReversalTarget(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default DistributionHistoryPage;
