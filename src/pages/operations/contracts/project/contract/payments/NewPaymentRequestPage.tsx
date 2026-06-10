import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency } from "../../../../../../utils/helpper";
import { AlertTriangle, Info } from "lucide-react";
import Button from "../../../../../../components/ui/Button";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import { useContractDetails } from "../../../../../../hooks/operations/contracts/useContracts";
import { supabase } from "../../../../../../lib/supabaseClient";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const labelClass = "text-sm font-medium text-gray-700";
const paymentMethods = [
  { value: "cash", label: "نقداً" },
  { value: "bank", label: "تحويل بنكي" },
];

type MilestoneEntry = { milestoneId: string; amount: number };

const NewPaymentRequestPage = () => {
  const navigate = useNavigate();
  const { contractId, projectId } = useParams<{
    contractId: string;
    projectId: string;
  }>();

  const { contract, loading, error } = useContractDetails(contractId ?? "");

  const [entries, setEntries] = useState<MilestoneEntry[]>([
    { milestoneId: "", amount: 0 },
  ]);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── all hooks before any early returns ────────────────────────────────────

  const paidByMilestone = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of contract?.payment_requests ?? []) {
      if (p.status === "declined") continue;
      map[p.milestone_id] = (map[p.milestone_id] ?? 0) + p.amount;
    }
    return map;
  }, [contract]);

  const pendingByMilestone = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of contract?.payment_requests ?? []) {
      if (p.status !== "pending") continue;
      map[p.milestone_id] = (map[p.milestone_id] ?? 0) + p.amount;
    }
    return map;
  }, [contract]);

  const totalPaidSoFar = useMemo(
    () =>
      contract?.payment_requests
        .filter((p) => p.status === "approved" || p.status === "paid")
        .reduce((s, p) => s + p.amount, 0) ?? 0,
    [contract],
  );

  // ── early returns after all hooks ─────────────────────────────────────────

  if (!contractId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات العقد..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!contract) return null;

  // ── derived values (contract is non-null here) ────────────────────────────

  const contractRemaining = contract.total_amount - totalPaidSoFar;

  function milestoneRemaining(milestoneId: string): number {
    const m = contract!.contract_milestones.find((m) => m.id === milestoneId);
    if (!m) return 0;
    return Math.max(m.amount - (paidByMilestone[milestoneId] ?? 0), 0);
  }

  const chosenIds = entries.map((e) => e.milestoneId).filter(Boolean);
  const availableMilestones = contract.contract_milestones.filter(
    (m) => m.status !== "completed",
  );

  function updateEntry(index: number, patch: Partial<MilestoneEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    );
  }
  function addEntry() {
    setEntries((prev) => [...prev, { milestoneId: "", amount: 0 }]);
  }
  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  const totalThisRequest = entries.reduce((s, e) => s + (e.amount || 0), 0);

  const entryErrors: (string | null)[] = entries.map((e) => {
    if (!e.milestoneId) return null;
    const rem = milestoneRemaining(e.milestoneId);
    if (e.amount <= 0) return "المبلغ يجب أن يكون أكبر من صفر";
    if (e.amount > rem) return `يتجاوز المتبقي (${formatCurrency(rem)})`;
    return null;
  });

  const hasAnyError = entryErrors.some(Boolean);
  const hasEmptyEntry = entries.some((e) => !e.milestoneId || e.amount <= 0);
  const canSave = !hasAnyError && !hasEmptyEntry && totalThisRequest > 0;

  async function handleSave() {
    if (!canSave || !contract) return;
    setSaving(true);
    setSaveError(null);
    try {
      const rows = entries.map((e) => ({
        project_id: projectId!,
        contract_id: contractId!,
        milestone_id: e.milestoneId,
        contractor_id: contract.contractors.id,
        requested_by: contract.employees.id,
        amount: e.amount,
        description: description || null,
        payment_method: paymentMethod as any,
        status: "pending" as const,
      }));
      const { error } = await supabase.from("payment_requests").insert(rows);
      if (error) throw error;
      navigate(-1);
    } catch (err: any) {
      setSaveError(err.message ?? "حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">طلب دفعة جديدة</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {contract.work_requests.title} · {contract.contractors.first_name}{" "}
            {contract.contractors.last_name ?? ""} · {contract.projects.name}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ── left: form ── */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">بيانات الدفعة</h2>
          <Separator />

          <div className="space-y-5 mt-2">
            <div className="space-y-4">
              <label className={labelClass}>
                المراحل <span className="text-red-500">*</span>
              </label>

              {entries.map((entry, index) => {
                const milestone = contract.contract_milestones.find(
                  (m) => m.id === entry.milestoneId,
                );
                const pending = entry.milestoneId
                  ? (pendingByMilestone[entry.milestoneId] ?? 0)
                  : 0;
                const rem = entry.milestoneId
                  ? milestoneRemaining(entry.milestoneId)
                  : 0;
                const entryErr = entryErrors[index];

                return (
                  <div
                    key={index}
                    className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        مرحلة {index + 1}
                      </span>
                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(index)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          حذف
                        </button>
                      )}
                    </div>

                    <select
                      className={inputClass}
                      value={entry.milestoneId}
                      onChange={(e) =>
                        updateEntry(index, {
                          milestoneId: e.target.value,
                          amount: 0,
                        })
                      }
                    >
                      <option value="">اختر المرحلة</option>
                      {availableMilestones.map((m) => {
                        const isChosen =
                          chosenIds.includes(m.id) &&
                          entry.milestoneId !== m.id;
                        return (
                          <option key={m.id} value={m.id} disabled={isChosen}>
                            {m.title} — {formatCurrency(m.amount)}
                          </option>
                        );
                      })}
                    </select>

                    {pending > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          يوجد طلب دفع معلّق بمبلغ{" "}
                          <span className="font-semibold">
                            {formatCurrency(pending)}
                          </span>{" "}
                          لهذه المرحلة لم يُسدَّد بعد.
                        </p>
                      </div>
                    )}

                    {entry.milestoneId && (
                      <div className="space-y-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          min={0}
                          max={rem}
                          className={`${inputClass} ${entryErr ? "border-red-400 focus:ring-red-400" : ""}`}
                          value={entry.amount || ""}
                          onChange={(e) =>
                            updateEntry(index, {
                              amount: Number(e.target.value),
                            })
                          }
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>
                            الحد الأقصى:{" "}
                            <span className="font-medium text-gray-600">
                              {formatCurrency(rem)}
                            </span>
                          </span>
                          {milestone && (
                            <span>
                              قيمة المرحلة:{" "}
                              <span className="font-medium text-gray-600">
                                {formatCurrency(milestone.amount)}
                              </span>
                            </span>
                          )}
                        </div>
                        {entryErr && (
                          <p className="text-xs text-red-500">{entryErr}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {entries.length < availableMilestones.length && (
                <button
                  onClick={addEntry}
                  className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition"
                >
                  + إضافة مرحلة أخرى
                </button>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <label className={labelClass}>طريقة الدفع</label>
              <div className="flex gap-3 flex-wrap">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center justify-center px-4 h-10 rounded-lg border text-sm font-medium cursor-pointer transition ${
                      paymentMethod === method.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      className="hidden"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>ملاحظات</label>
              <textarea
                rows={3}
                placeholder="أي ملاحظات إضافية..."
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Separator />

            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                disabled={!canSave || saving}
                onClick={handleSave}
              >
                {saving ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
              <Button variant="primary-outline" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>

        {/* ── right: summary ── */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">ملخص العقد</h2>
            <Separator />
            <InfoRow
              label="إجمالي العقد"
              value={formatCurrency(contract.total_amount)}
            />
            <InfoRow
              label="المدفوع حتى الآن"
              value={
                <span className="text-orange-600 font-semibold">
                  {formatCurrency(totalPaidSoFar)}
                </span>
              }
            />
            <InfoRow
              label="إجمالي هذا الطلب"
              value={
                <span
                  className={`font-semibold ${hasAnyError ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatCurrency(totalThisRequest)}
                </span>
              }
            />
            <InfoRow
              label="المتبقي بعد الدفع"
              value={
                <span
                  className={`font-semibold ${contractRemaining - totalThisRequest < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(
                    Math.max(contractRemaining - totalThisRequest, 0),
                  )}
                </span>
              }
              bordered={false}
            />

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>نسبة الدفع</span>
                <span>
                  {Math.min(
                    Math.round(
                      ((totalPaidSoFar + totalThisRequest) /
                        contract.total_amount) *
                        100,
                    ),
                    100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{
                    width: `${Math.min((totalPaidSoFar / contract.total_amount) * 100, 100)}%`,
                  }}
                />
                <div
                  className={`h-full transition-all duration-300 ${hasAnyError ? "bg-red-500" : "bg-blue-500"}`}
                  style={{
                    width: `${Math.min((totalThisRequest / contract.total_amount) * 100, 100 - (totalPaidSoFar / contract.total_amount) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  مدفوع
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${hasAnyError ? "bg-red-500" : "bg-blue-500"}`}
                  />
                  هذا الطلب
                </span>
              </div>
            </div>
          </div>

          {entries.some((e) => e.milestoneId) && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
              <h2 className="font-semibold text-gray-900 mb-1">
                تفاصيل المراحل المختارة
              </h2>
              <Separator />
              {entries
                .filter((e) => e.milestoneId)
                .map((e, i) => {
                  const m = contract.contract_milestones.find(
                    (m) => m.id === e.milestoneId,
                  );
                  if (!m) return null;
                  const paid = paidByMilestone[m.id] ?? 0;
                  const rem = milestoneRemaining(m.id);
                  return (
                    <div
                      key={i}
                      className={
                        i > 0 ? "mt-3 pt-3 border-t border-gray-100" : ""
                      }
                    >
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        {m.title}
                      </p>
                      <InfoRow
                        label="قيمة المرحلة"
                        value={formatCurrency(m.amount)}
                      />
                      <InfoRow
                        label="المطالب به / المدفوع"
                        value={
                          <span className="text-orange-600 font-semibold">
                            {formatCurrency(paid)}
                          </span>
                        }
                      />
                      <InfoRow
                        label="المتبقي"
                        value={
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(rem)}
                          </span>
                        }
                        bordered={false}
                      />
                    </div>
                  );
                })}
            </div>
          )}

          <div className="rounded-lg shadow-sm p-4 flex gap-3 items-start bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700">
              سيتم إرسال الطلب للمراجعة والاعتماد قبل الصرف.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPaymentRequestPage;
