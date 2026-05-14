import React, { useState } from "react";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency } from "../../../../../../utils/helpper";
import { Info } from "lucide-react";
import Button from "../../../../../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import { useContractDetails } from "../../../../../../hooks/operations/contracts/useContracts";
import { supabase } from "../../../../../../lib/supabaseClient";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const labelClass = "text-sm font-medium text-gray-700";

const NewMilestonePage = () => {
  const navigate = useNavigate();
  const { contractId } = useParams<{ contractId: string; projectId: string }>();

  const { contract, loading, error } = useContractDetails(contractId ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!contractId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات العقد..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!contract) return null;

  const alreadyAllocated = contract.contract_milestones.reduce(
    (sum, m) => sum + m.amount,
    0,
  );
  const remaining = contract.total_amount - alreadyAllocated - amount;
  const isOverBudget = remaining < 0;

  const allocatedPercent = Math.min(
    (alreadyAllocated / contract.total_amount) * 100,
    100,
  );
  const thisPercent = Math.min(
    (amount / contract.total_amount) * 100,
    100 - allocatedPercent,
  );

  async function handleSave() {
    if (!title || amount <= 0 || isOverBudget) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase.from("contract_milestones").insert({
        contract_id: contractId!,
        title,
        description: description || null,
        amount,
        due_date: dueDate || null,
        order_index: order,
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
          <h1 className="text-2xl font-semibold">إضافة مرحلة جديدة</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {contract.work_requests.title} · {contract.contractors.first_name}{" "}
            {contract.contractors.last_name ?? ""} · {contract.projects.name}
          </h4>
        </div>
      </div>

      {/* body */}
      <div className="grid grid-cols-2 gap-4">
        {/* left — form */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">بيانات المرحلة</h2>
          <Separator />

          <div className="space-y-5 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                عنوان المرحلة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: تركيب الأساسات"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>الوصف</label>
              <textarea
                rows={3}
                placeholder="وصف تفصيلي للمرحلة..."
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  المبلغ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min={0}
                  className={`${inputClass} ${isOverBudget ? "border-red-400 focus:ring-red-400" : ""}`}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                {isOverBudget && (
                  <p className="text-xs text-red-500">
                    المبلغ يتجاوز الميزانية المتبقية
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>تاريخ الاستحقاق</label>
                <input
                  type="date"
                  className={inputClass}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <label className={labelClass}>الترتيب</label>
              <div className="flex gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label
                    key={num}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium cursor-pointer transition ${
                      order === num
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="order"
                      value={num}
                      className="hidden"
                      checked={order === num}
                      onChange={() => setOrder(num)}
                    />
                    {num}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                الترتيب يحدد متى تظهر هذه المرحلة في القائمة
              </p>
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
                disabled={!title || amount <= 0 || isOverBudget || saving}
                onClick={handleSave}
              >
                {saving ? "جاري الحفظ..." : "حفظ المرحلة"}
              </Button>
              <Button variant="primary-outline" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>

        {/* right — budget summary */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">توزيع ميزانية العقد</h2>
            <Separator />

            <InfoRow
              label="إجمالي العقد"
              value={formatCurrency(contract.total_amount)}
            />
            <InfoRow
              label="موزّع على مراحل سابقة"
              value={
                <span className="text-orange-600 font-semibold">
                  {formatCurrency(alreadyAllocated)}
                </span>
              }
            />
            <InfoRow
              label="هذه المرحلة"
              value={
                <span
                  className={`font-semibold ${isOverBudget ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatCurrency(amount)}
                </span>
              }
            />
            <InfoRow
              label="المتبقي بعد الإضافة"
              value={
                <span
                  className={`font-semibold ${isOverBudget ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(Math.max(remaining, 0))}
                </span>
              }
              bordered={false}
            />

            {/* progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>توزيع الميزانية</span>
                <span>{Math.round(allocatedPercent + thisPercent)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${allocatedPercent}%` }}
                />
                <div
                  className={`h-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${thisPercent}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  مراحل سابقة
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${isOverBudget ? "bg-red-500" : "bg-blue-500"}`}
                  />
                  هذه المرحلة
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
                  متبقي
                </span>
              </div>
            </div>
          </div>

          {/* tip */}
          <div
            className={`rounded-lg shadow-sm p-4 flex gap-3 items-start ${
              isOverBudget
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-100"
            }`}
          >
            <Info
              className={`w-4 h-4 mt-0.5 shrink-0 ${isOverBudget ? "text-red-500" : "text-blue-500"}`}
            />
            <p
              className={`text-sm ${isOverBudget ? "text-red-700" : "text-blue-700"}`}
            >
              {isOverBudget
                ? "المبلغ المدخل يتجاوز الميزانية المتبقية للعقد. يرجى تعديل المبلغ."
                : "مجموع المراحل يجب أن يساوي إجمالي العقد تماماً"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMilestonePage;
