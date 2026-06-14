import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDistributionBatches } from "../../hooks/company/useDistributionBatches";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import { formatCurrency } from "../../utils/helpper";
import BatchSharesPdfButton from "../../components/pdf-buttons/BatchSharesPdfButton";

const CURRENCIES = ["LYD", "USD", "EUR"];

const DistributionBatchesPage = () => {
  const { batches, loading, error } = useDistributionBatches();
  const navigate = useNavigate();
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  if (loading) return <LoadingPage label="جاري تحميل سجل التوزيعات" />;
  if (error)
    return (
      <ErrorPage error={error.message || "حدث خطأ"} label="سجل التوزيعات" />
    );

  const safeBatches = batches ?? [];

  return (
    <div className="p-4" dir="rtl">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800">سجل التوزيعات</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          كل صف يمثل دفعة توزيع يومية — اضغط لعرض المشاريع داخلها
        </p>
      </div>

      {safeBatches.length === 0 ? (
        <div className="max-w-4xl mx-auto py-20 text-center text-gray-400 text-sm">
          لا توجد توزيعات مسجّلة
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-3">
          {safeBatches.map((batch, batchIndex) => {
            const isOpen = openDates.has(batch.date);

            // Group periods inside batch by project
            const projectMap = new Map<
              string,
              {
                projectId: string;
                projectName: string;
                projectSerial: number | null;
                periodIds: string[];
                totalsByCurrency: Record<string, number>;
                employeeIds: Set<string>;
                hasReversed: boolean;
              }
            >();

            for (const p of batch.periods) {
              if (!projectMap.has(p.project_id)) {
                projectMap.set(p.project_id, {
                  projectId: p.project_id,
                  projectName: p.project_name,
                  projectSerial: p.project_serial,
                  periodIds: [],
                  totalsByCurrency: {},
                  employeeIds: new Set(),
                  hasReversed: false,
                });
              }
              const entry = projectMap.get(p.project_id)!;
              entry.periodIds.push(p.id);
              entry.totalsByCurrency[p.currency] =
                (entry.totalsByCurrency[p.currency] ?? 0) + p.total_amount;
              p.employee_ids.forEach((id) => entry.employeeIds.add(id));
              if (p.status === "reversed") entry.hasReversed = true;
            }

            const projectEntries = Array.from(projectMap.values());

            return (
              <div
                key={batch.date}
                className="rounded-xl border bg-white shadow-sm overflow-hidden"
              >
                {/* Batch header — NOT a button to avoid nesting issues */}
                <div className="w-full flex items-center justify-between px-5 py-4 bg-white">
                  {/* Left side: toggle area (clickable) */}
                  <button
                    onClick={() => toggleDate(batch.date)}
                    className="flex items-center gap-3 flex-1 text-right hover:opacity-80 transition-opacity"
                  >
                    {/* Index badge */}
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {safeBatches.length - batchIndex}
                    </span>

                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        دفعة {batch.date}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {projectEntries.length} مشروع · {batch.employeeCount}{" "}
                        موظف
                        {batch.hasReversed && (
                          <span className="mr-2 text-red-400">
                            · يحتوي على معكوس
                          </span>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Right side: currency totals + PDF button + chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex gap-3">
                      {CURRENCIES.filter(
                        (c) => (batch.totalsByCurrency[c] ?? 0) > 0,
                      ).map((c) => (
                        <span
                          key={c}
                          className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md tabular-nums"
                        >
                          {c} {formatCurrency(batch.totalsByCurrency[c], c)}
                        </span>
                      ))}
                    </div>

                    {/* PDF button — outside any <button> */}
                    <BatchSharesPdfButton batch={batch} />

                    <button
                      onClick={() => toggleDate(batch.date)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <span
                        className={`inline-block transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded project list */}
                {isOpen && (
                  <div className="border-t divide-y bg-gray-50">
                    {/* Mobile currency totals */}
                    <div className="sm:hidden flex gap-2 px-5 py-2 flex-wrap">
                      {CURRENCIES.filter(
                        (c) => (batch.totalsByCurrency[c] ?? 0) > 0,
                      ).map((c) => (
                        <span
                          key={c}
                          className="text-xs font-semibold text-gray-700 bg-white border px-2 py-0.5 rounded tabular-nums"
                        >
                          {c} {formatCurrency(batch.totalsByCurrency[c], c)}
                        </span>
                      ))}
                    </div>

                    {projectEntries.map((proj) => (
                      <button
                        key={proj.projectId}
                        onClick={() =>
                          navigate(
                            `/company/distribute/project/${proj.projectId}?date=${batch.date}`,
                          )
                        }
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white transition-colors text-right group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Status dot */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              proj.hasReversed ? "bg-red-400" : "bg-green-400"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                              {proj.projectSerial
                                ? `#${proj.projectSerial} `
                                : ""}
                              {proj.projectName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {proj.employeeIds.size} موظف
                              {proj.hasReversed && (
                                <span className="text-red-400 mr-1">
                                  · معكوس
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Per-currency amounts */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end gap-0.5">
                            {CURRENCIES.filter(
                              (c) => (proj.totalsByCurrency[c] ?? 0) > 0,
                            ).map((c) => (
                              <span
                                key={c}
                                className="text-xs tabular-nums text-gray-600"
                              >
                                {c}{" "}
                                {formatCurrency(proj.totalsByCurrency[c], c)}
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-300 group-hover:text-blue-400 text-sm">
                            ‹
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DistributionBatchesPage;
