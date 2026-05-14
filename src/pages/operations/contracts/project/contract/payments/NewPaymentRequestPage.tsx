import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency } from "../../../../../../utils/helpper";
import { Info } from "lucide-react";
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
  { value: "cheque", label: "شيك" },
];

const NewPaymentRequestPage = () => {
  const navigate = useNavigate();
  const { contractId, projectId } = useParams<{
    contractId: string;
    projectId: string;
  }>();

  const { contract, loading, error } = useContractDetails(contractId ?? "");

  const [milestoneId, setMilestoneId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!contractId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات العقد..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!contract) return null;

  const selectedMilestone = contract.contract_milestones.find(
    (m) => m.id === milestoneId,
  );

  const alreadyPaid = contract.payment_requests
    .filter(
      (p) =>
        p.contract_milestones.title === selectedMilestone?.title &&
        (p.status === "approved" || p.status === "paid"),
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const milestoneRemaining = selectedMilestone
    ? selectedMilestone.amount - alreadyPaid
    : 0;

  const isOverMilestone =
    selectedMilestone !== undefined && amount > milestoneRemaining;

  const totalPaid = contract.payment_requests
    .filter((p) => p.status === "approved" || p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const contractRemaining = contract.total_amount - totalPaid;

  const availableMilestones = contract.contract_milestones.filter(
    (m) => m.status !== "approved" && m.status !== "completed",
  );

  async function handleSave() {
    if (!milestoneId || amount <= 0 || isOverMilestone) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        project_id: projectId!,
        contract_id: contractId!,
        milestone_id: milestoneId,
        contractor_id: contract!.contractors.id,
        requested_by: contract!.employees.id,
        amount,
        description: description || null,
        payment_method: paymentMethod as any,
        status: "pending" as const,
      });
      if (error) throw error;
      navigate(-1);
    } catch (err: any) {
      setSaveError(err.message ?? "حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-4">
      {/* header */}
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
        {/* left — form */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">بيانات الدفعة</h2>
          <Separator />

          <div className="space-y-5 mt-2">
            {/* milestone select */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                المرحلة <span className="text-red-500">*</span>
              </label>
              {availableMilestones.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  لا توجد مراحل متاحة للدفع
                </p>
              ) : (
                <select
                  className={inputClass}
                  value={milestoneId}
                  onChange={(e) => {
                    setMilestoneId(e.target.value);
                    setAmount(0);
                  }}
                >
                  <option value="">اختر المرحلة</option>
                  {availableMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {formatCurrency(m.amount)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Separator />

            {/* amount */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                المبلغ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                min={0}
                max={milestoneRemaining}
                className={`${inputClass} ${isOverMilestone ? "border-red-400 focus:ring-red-400" : ""}`}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              {selectedMilestone && (
                <p className="text-xs text-gray-400">
                  الحد الأقصى للمرحلة:{" "}
                  <span className="font-medium text-gray-600">
                    {formatCurrency(milestoneRemaining)}
                  </span>
                </p>
              )}
              {isOverMilestone && (
                <p className="text-xs text-red-500">
                  المبلغ يتجاوز المتبقي من هذه المرحلة
                </p>
              )}
            </div>

            <Separator />

            {/* payment method */}
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

            {/* description */}
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
                disabled={
                  !milestoneId || amount <= 0 || isOverMilestone || saving
                }
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

        {/* right — summary */}
        <div className="space-y-3">
          {/* contract summary */}
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
                  {formatCurrency(totalPaid)}
                </span>
              }
            />
            <InfoRow
              label="هذه الدفعة"
              value={
                <span
                  className={`font-semibold ${isOverMilestone ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatCurrency(amount)}
                </span>
              }
            />
            <InfoRow
              label="المتبقي بعد الدفع"
              value={
                <span
                  className={`font-semibold ${contractRemaining - amount < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(Math.max(contractRemaining - amount, 0))}
                </span>
              }
              bordered={false}
            />

            {/* progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>نسبة الدفع</span>
                <span>
                  {Math.min(
                    Math.round(
                      ((totalPaid + amount) / contract.total_amount) * 100,
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
                    width: `${Math.min((totalPaid / contract.total_amount) * 100, 100)}%`,
                  }}
                />
                <div
                  className={`h-full transition-all duration-300 ${isOverMilestone ? "bg-red-500" : "bg-blue-500"}`}
                  style={{
                    width: `${Math.min((amount / contract.total_amount) * 100, 100 - (totalPaid / contract.total_amount) * 100)}%`,
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
                    className={`w-2 h-2 rounded-full inline-block ${isOverMilestone ? "bg-red-500" : "bg-blue-500"}`}
                  />
                  هذه الدفعة
                </span>
              </div>
            </div>
          </div>

          {/* selected milestone detail */}
          {selectedMilestone && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
              <h2 className="font-semibold text-gray-900">تفاصيل المرحلة</h2>
              <Separator />
              <InfoRow label="العنوان" value={selectedMilestone.title} />
              <InfoRow
                label="قيمة المرحلة"
                value={formatCurrency(selectedMilestone.amount)}
              />
              <InfoRow
                label="المدفوع من المرحلة"
                value={
                  <span className="text-orange-600 font-semibold">
                    {formatCurrency(alreadyPaid)}
                  </span>
                }
              />
              <InfoRow
                label="المتبقي من المرحلة"
                value={
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(milestoneRemaining)}
                  </span>
                }
                bordered={false}
              />
            </div>
          )}

          {/* tip */}
          <div
            className={`rounded-lg shadow-sm p-4 flex gap-3 items-start ${
              isOverMilestone
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-100"
            }`}
          >
            <Info
              className={`w-4 h-4 mt-0.5 shrink-0 ${isOverMilestone ? "text-red-500" : "text-blue-500"}`}
            />
            <p
              className={`text-sm ${isOverMilestone ? "text-red-700" : "text-blue-700"}`}
            >
              {isOverMilestone
                ? "المبلغ المدخل يتجاوز المتبقي من هذه المرحلة."
                : "سيتم إرسال الطلب للمراجعة والاعتماد قبل الصرف."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPaymentRequestPage;
