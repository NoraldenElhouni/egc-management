import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency } from "../../../../../../utils/helpper";
import { Info, Plus, Trash } from "lucide-react";
import Button from "../../../../../../components/ui/Button";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import { useContractDetails } from "../../../../../../hooks/operations/contracts/useContracts";
import {
  PaymentPenaltyInput,
  useCreateRequestPayment,
} from "../../../../../../hooks/operations/contracts/usePayments";
import { PaymentMethod } from "../../../../../../types/global.type";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const labelClass = "text-sm font-medium text-gray-700";
const paymentMethods = [
  { value: "cash", label: "نقداً" },
  { value: "bank", label: "تحويل بنكي" },
] as const;

const NewPaymentRequestPage = () => {
  const navigate = useNavigate();
  const { contractId, projectId } = useParams<{
    contractId: string;
    projectId: string;
  }>();

  const { contract, loading, error } = useContractDetails(contractId ?? "");
  const { createRequestPayment, loading: saving } = useCreateRequestPayment();

  const [selectedAmounts, setSelectedAmounts] = useState<
    Record<string, number>
  >({});
  const [penalties, setPenalties] = useState<PaymentPenaltyInput[]>([]);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── all hooks before any early returns ────────────────────────────────────

  const paidByMilestone = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of contract?.request_payments ?? []) {
      if (p.status !== "approved" && p.status !== "paid") continue;
      for (const pm of p.payment_milestones) {
        map[pm.milestone_id] = (map[pm.milestone_id] ?? 0) + pm.amount;
      }
    }
    return map;
  }, [contract]);

  const pendingByMilestone = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of contract?.request_payments ?? []) {
      if (p.status !== "pending") continue;
      for (const pm of p.payment_milestones) {
        map[pm.milestone_id] = (map[pm.milestone_id] ?? 0) + pm.amount;
      }
    }
    return map;
  }, [contract]);

  const totalPaidSoFar = useMemo(
    () =>
      contract?.request_payments
        .filter((p) => p.status === "approved" || p.status === "paid")
        .reduce((s, p) => s + (p.grand_total ?? p.amount), 0) ?? 0,
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
    const m = contract!.milestones.find((m) => m.id === milestoneId);
    if (!m) return 0;
    return Math.max(m.amount - (paidByMilestone[milestoneId] ?? 0), 0);
  }

  const availableMilestones = contract.milestones.filter(
    (m) => milestoneRemaining(m.id) > 0,
  );

  function toggleMilestone(milestoneId: string) {
    setSelectedAmounts((prev) => {
      const next = { ...prev };
      if (milestoneId in next) {
        delete next[milestoneId];
      } else {
        next[milestoneId] = milestoneRemaining(milestoneId);
      }
      return next;
    });
  }

  function updateAmount(milestoneId: string, amount: number) {
    setSelectedAmounts((prev) => ({ ...prev, [milestoneId]: amount }));
  }

  function addPenalty() {
    setPenalties((prev) => [
      ...prev,
      { milestone_id: null, amount: 0, reason: "", description: "", image: null },
    ]);
  }
  function updatePenalty(index: number, patch: Partial<PaymentPenaltyInput>) {
    setPenalties((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }
  function removePenalty(index: number) {
    setPenalties((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedIds = Object.keys(selectedAmounts);
  const totalMilestonesAmount = selectedIds.reduce(
    (s, id) => s + (selectedAmounts[id] || 0),
    0,
  );
  const totalPenaltiesAmount = penalties.reduce(
    (s, p) => s + (p.amount || 0),
    0,
  );
  const grandTotal = totalMilestonesAmount - totalPenaltiesAmount;

  const milestoneErrors: Record<string, string | null> = {};
  for (const id of selectedIds) {
    const amount = selectedAmounts[id];
    const rem = milestoneRemaining(id);
    if (amount <= 0) milestoneErrors[id] = "المبلغ يجب أن يكون أكبر من صفر";
    else if (amount > rem)
      milestoneErrors[id] = `يتجاوز المتبقي (${formatCurrency(rem)})`;
    else milestoneErrors[id] = null;
  }
  const hasMilestoneError = Object.values(milestoneErrors).some(Boolean);

  const penaltyErrors: (string | null)[] = penalties.map((p) => {
    if (!p.reason) return "السبب مطلوب";
    if (p.amount <= 0) return "المبلغ يجب أن يكون أكبر من صفر";
    return null;
  });
  const hasPenaltyError = penaltyErrors.some(Boolean);

  const canSave =
    selectedIds.length > 0 &&
    !hasMilestoneError &&
    !hasPenaltyError &&
    !saving;

  async function handleSave() {
    if (!canSave || !contract || !contractId || !projectId) return;
    setSaveError(null);

    const milestones = selectedIds.map((id) => ({
      milestone_id: id,
      amount: selectedAmounts[id],
    }));

    const { error } = await createRequestPayment({
      project_id: projectId,
      contract_id: contractId,
      contractor_id: contract.contractor_id,
      description: description || null,
      payment_method: paymentMethod,
      milestones,
      penalties,
    });

    if (error) {
      setSaveError(error.message || "حدث خطأ أثناء الحفظ");
      return;
    }
    navigate(-1);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">طلب دفعة جديدة</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {contract.round?.title ?? "—"} ·{" "}
            {contract.contractor
              ? `${contract.contractor.first_name} ${contract.contractor.last_name ?? ""}`
              : "—"}{" "}
            · {contract.project?.name ?? "—"}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ── left: form ── */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">اختيار المراحل</h2>
          <Separator />

          <div className="space-y-5 mt-2">
            <div className="space-y-3">
              {availableMilestones.length === 0 && (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  لا توجد مراحل متبقية للدفع
                </p>
              )}

              {availableMilestones.map((m) => {
                const checked = m.id in selectedAmounts;
                const pending = pendingByMilestone[m.id] ?? 0;
                const rem = milestoneRemaining(m.id);
                const err = milestoneErrors[m.id];

                return (
                  <div
                    key={m.id}
                    className={`border rounded-xl p-4 space-y-3 transition ${
                      checked
                        ? "border-blue-200 bg-blue-50/40"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={checked}
                        onChange={() => toggleMilestone(m.id)}
                      />
                      <span className="font-medium text-gray-800 text-sm">
                        {m.title}
                      </span>
                      <span className="text-xs text-gray-400 mr-auto">
                        {formatCurrency(m.amount)}
                      </span>
                    </label>

                    {pending > 0 && (
                      <p className="text-xs text-amber-600">
                        يوجد طلب دفع معلّق بمبلغ {formatCurrency(pending)} لهذه
                        المرحلة لم يُسدَّد بعد.
                      </p>
                    )}

                    {checked && (
                      <div className="space-y-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          min={0}
                          max={rem}
                          className={`${inputClass} ${err ? "border-red-400 focus:ring-red-400" : ""}`}
                          value={selectedAmounts[m.id] || ""}
                          onChange={(e) =>
                            updateAmount(m.id, Number(e.target.value))
                          }
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>
                            الحد الأقصى:{" "}
                            <span className="font-medium text-gray-600">
                              {formatCurrency(rem)}
                            </span>
                          </span>
                        </div>
                        {err && <p className="text-xs text-red-500">{err}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
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

            {/* penalties */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>الغرامات (اختياري)</label>
                <button
                  type="button"
                  onClick={addPenalty}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة غرامة
                </button>
              </div>

              {penalties.map((p, index) => {
                const err = penaltyErrors[index];
                return (
                  <div
                    key={index}
                    className="border border-red-100 bg-red-50/40 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        غرامة {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePenalty(index)}
                        className="text-red-400 hover:text-red-600 transition"
                        aria-label="حذف الغرامة"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      className={inputClass}
                      value={p.milestone_id ?? ""}
                      onChange={(e) =>
                        updatePenalty(index, {
                          milestone_id: e.target.value || null,
                        })
                      }
                    >
                      <option value="">بدون مرحلة محددة</option>
                      {contract.milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="مبلغ الغرامة"
                      min={0}
                      className={inputClass}
                      value={p.amount || ""}
                      onChange={(e) =>
                        updatePenalty(index, { amount: Number(e.target.value) })
                      }
                    />

                    <input
                      type="text"
                      placeholder="سبب الغرامة"
                      className={inputClass}
                      value={p.reason}
                      onChange={(e) =>
                        updatePenalty(index, { reason: e.target.value })
                      }
                    />

                    <textarea
                      rows={2}
                      placeholder="تفاصيل إضافية (اختياري)"
                      className={inputClass}
                      value={p.description ?? ""}
                      onChange={(e) =>
                        updatePenalty(index, {
                          description: e.target.value || null,
                        })
                      }
                    />

                    <input
                      type="file"
                      accept="image/*"
                      className={inputClass}
                      onChange={(e) =>
                        updatePenalty(index, {
                          image: e.target.files?.[0] ?? null,
                        })
                      }
                    />

                    {err && <p className="text-xs text-red-500">{err}</p>}
                  </div>
                );
              })}
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
                disabled={!canSave}
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
              label="إجمالي المراحل المختارة"
              value={
                <span
                  className={`font-semibold ${hasMilestoneError ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatCurrency(totalMilestonesAmount)}
                </span>
              }
            />
            <InfoRow
              label="إجمالي الغرامات"
              value={
                <span className="font-semibold text-red-600">
                  -{formatCurrency(totalPenaltiesAmount)}
                </span>
              }
            />
            <InfoRow
              label="الصافي لهذا الطلب"
              value={
                <span
                  className={`font-semibold ${grandTotal < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(grandTotal)}
                </span>
              }
            />
            <InfoRow
              label="المتبقي بعد الدفع"
              value={
                <span
                  className={`font-semibold ${contractRemaining - totalMilestonesAmount < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(
                    Math.max(contractRemaining - totalMilestonesAmount, 0),
                  )}
                </span>
              }
              bordered={false}
            />

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>نسبة الدفع</span>
                <span>
                  {contract.total_amount > 0
                    ? Math.min(
                        Math.round(
                          ((totalPaidSoFar + totalMilestonesAmount) /
                            contract.total_amount) *
                            100,
                        ),
                        100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{
                    width: `${
                      contract.total_amount > 0
                        ? Math.min(
                            (totalPaidSoFar / contract.total_amount) * 100,
                            100,
                          )
                        : 0
                    }%`,
                  }}
                />
                <div
                  className={`h-full transition-all duration-300 ${hasMilestoneError ? "bg-red-500" : "bg-blue-500"}`}
                  style={{
                    width: `${
                      contract.total_amount > 0
                        ? Math.min(
                            (totalMilestonesAmount / contract.total_amount) *
                              100,
                            100 - (totalPaidSoFar / contract.total_amount) * 100,
                          )
                        : 0
                    }%`,
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
                    className={`w-2 h-2 rounded-full inline-block ${hasMilestoneError ? "bg-red-500" : "bg-blue-500"}`}
                  />
                  هذا الطلب
                </span>
              </div>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
              <h2 className="font-semibold text-gray-900 mb-1">
                تفاصيل المراحل المختارة
              </h2>
              <Separator />
              {selectedIds.map((id, i) => {
                const m = contract.milestones.find((m) => m.id === id);
                if (!m) return null;
                const paid = paidByMilestone[id] ?? 0;
                const rem = milestoneRemaining(id);
                return (
                  <div
                    key={id}
                    className={i > 0 ? "mt-3 pt-3 border-t border-gray-100" : ""}
                  >
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {m.title}
                    </p>
                    <InfoRow
                      label="قيمة المرحلة"
                      value={formatCurrency(m.amount)}
                    />
                    <InfoRow
                      label="مدفوع سابقاً"
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
