import { useState } from "react";
import { X } from "lucide-react";
import { QuoteRow } from "../../hooks/operations/contracts/rounds/useQuotes";
import { useAwardQuote } from "../../hooks/operations/contracts/rounds/useAwardQuote";
import { formatCurrency } from "../../utils/helpper";

interface AwardQuoteDialogProps {
  quote: QuoteRow;
  onClose: () => void;
  onSuccess: (contractId: string) => void;
}

type MilestoneDraft = {
  tempId: string;
  title: string;
  description: string | null;
  percentage: number;
  due_date: string | null;
};

const AwardQuoteDialog = ({
  quote,
  onClose,
  onSuccess,
}: AwardQuoteDialogProps) => {
  const { awardQuote, loading } = useAwardQuote();
  const [error, setError] = useState<string | null>(null);

  const [advancePercentage, setAdvancePercentage] = useState(0);
  const [insurancePercentage, setInsurancePercentage] = useState(0);
  const [delayPenalty, setDelayPenalty] = useState<number | "">("");
  const [durationDays, setDurationDays] = useState<number | "">(
    quote.days_needed ?? "",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [terms, setTerms] = useState("");
  const [pushExtras, setPushExtras] = useState(true);

  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);

  const percentageTotal = milestones.reduce(
    (s, m) => s + (Number(m.percentage) || 0),
    0,
  );
  const isComplete =
    milestones.length > 0 && Math.round(percentageTotal) === 100;

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        title: "",
        description: null,
        percentage: 0,
        due_date: null,
      },
    ]);
  };
  const removeMilestone = (tempId: string) => {
    setMilestones((prev) => prev.filter((m) => m.tempId !== tempId));
  };
  const updateMilestone = (tempId: string, patch: Partial<MilestoneDraft>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, ...patch } : m)),
    );
  };

  const hasPricedItems = quote.total > 0;
  const canSubmit =
    isComplete && milestones.every((m) => m.title.trim()) && hasPricedItems;
  const hasExtras = quote.quote_items.some((i) => i.round_item_id === null);

  async function handleSubmit() {
    if (!hasPricedItems) {
      setError("لا يمكن ترسية عرض بدون بنود مُسعّرة");
      return;
    }
    if (!canSubmit) {
      setError("يجب أن تصل نسب المراحل إلى 100% ولكل مرحلة عنوان");
      return;
    }
    setError(null);
    const { error: awardError, contractId } = await awardQuote({
      quote_id: quote.id,
      advance_percentage: advancePercentage,
      insurance_percentage: insurancePercentage,
      delay_penalty_per_day: delayPenalty === "" ? null : Number(delayPenalty),
      duration_days: durationDays === "" ? null : Number(durationDays),
      start_date: startDate || null,
      terms: terms || null,
      push_extras: pushExtras,
      milestones: milestones.map((m) => ({
        title: m.title,
        description: m.description,
        percentage: m.percentage,
        due_date: m.due_date,
      })),
    });
    if (awardError || !contractId) {
      setError(
        "حدث خطأ أثناء ترسية العرض: " + (awardError?.message ?? ""),
      );
      return;
    }
    onSuccess(contractId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg text-gray-900">
            ترسية العرض وإنشاء العقد
          </h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* quote summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">المقاول</span>
              <span className="font-medium">
                {quote.contractor?.first_name}{" "}
                {quote.contractor?.last_name ?? ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">إجمالي العرض</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(quote.total)}
              </span>
            </div>
            {quote.days_needed != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">المدة المطلوبة</span>
                <span className="font-medium">{quote.days_needed} يوم</span>
              </div>
            )}
          </div>

          {/* terms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                نسبة الدفعة المقدمة %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                نسبة الضمان %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={insurancePercentage}
                onChange={(e) =>
                  setInsurancePercentage(Number(e.target.value))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                غرامة التأخير / يوم
              </label>
              <input
                type="number"
                min={0}
                value={delayPenalty}
                onChange={(e) =>
                  setDelayPenalty(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                مدة التنفيذ (أيام)
              </label>
              <input
                type="number"
                min={0}
                value={durationDays}
                onChange={(e) =>
                  setDurationDays(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-medium text-gray-500">
                تاريخ البدء
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              شروط العقد
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {hasExtras && (
            <label className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={pushExtras}
                onChange={(e) => setPushExtras(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  إضافة البنود الإضافية إلى قائمة الكميات
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  البنود الإضافية ستُدرج في العقد على أي حال. تفعيل هذا
                  الخيار يضيفها أيضاً إلى قائمة الكميات (BOQ) لتظهر في
                  الجولات القادمة
                </p>
              </div>
            </label>
          )}

          {/* milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  مراحل العقد
                </h3>
                {milestones.length > 0 && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      Math.round(percentageTotal) === 100
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {percentageTotal}% / 100%
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + إضافة مرحلة
              </button>
            </div>

            {milestones.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400 text-xs">
                أضف مرحلة واحدة على الأقل لتوزيع قيمة العقد
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, index) => (
                  <div
                    key={m.tempId}
                    className="border rounded-lg p-3 space-y-2 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">
                        مرحلة {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(m.tempId)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="اسم المرحلة"
                        value={m.title}
                        onChange={(e) =>
                          updateMilestone(m.tempId, { title: e.target.value })
                        }
                        className="col-span-2 border rounded-lg px-2 py-1.5 text-sm bg-white"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="%"
                        value={m.percentage || ""}
                        onChange={(e) =>
                          updateMilestone(m.tempId, {
                            percentage: Number(e.target.value),
                          })
                        }
                        className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                      />
                    </div>
                    <input
                      type="date"
                      value={m.due_date ?? ""}
                      onChange={(e) =>
                        updateMilestone(m.tempId, {
                          due_date: e.target.value || null,
                        })
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="وصف (اختياري)"
                      value={m.description ?? ""}
                      onChange={(e) =>
                        updateMilestone(m.tempId, {
                          description: e.target.value || null,
                        })
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white resize-none"
                    />
                  </div>
                ))}
                <div className="border rounded-xl p-3 bg-white flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        Math.round(percentageTotal) === 100
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(percentageTotal, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      Math.round(percentageTotal) === 100
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {percentageTotal}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "جاري الترسية..." : "تأكيد الترسية وإنشاء العقد"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwardQuoteDialog;
