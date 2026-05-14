// MilestoneReportsPage.tsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useMilestone } from "../../../../../../hooks/operations/contracts/useMilestone";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Button from "../../../../../../components/ui/Button";
import Separator from "../../../../../../components/ui/separator";
import GenericTable from "../../../../../../components/tables/table";
import { MilestoneReportsColumns } from "../../../../../../components/tables/columns/operations/contracts/milestoneReportsColumns";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import { Plus, Upload } from "lucide-react";
import { supabase } from "../../../../../../lib/supabaseClient";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const labelClass = "text-sm font-medium text-gray-700";

const MilestoneReportsPage = () => {
  const { milestoneId, contractId } = useParams<{
    milestoneId: string;
    contractId: string;
    projectId: string;
  }>();

  const { milestone, loading, error } = useMilestone(milestoneId ?? "");

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amountDone, setAmountDone] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!milestoneId) return null;
  if (loading) return <LoadingPage label="جاري تحميل التقارير..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!milestone) return null;

  const totalReported = milestone.milestone_reports.reduce(
    (sum, r) => sum + (r.amount_done ?? 0),
    0,
  );
  const remaining = milestone.amount - totalReported;

  async function handleSubmitReport() {
    if (!description || amountDone <= 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      // get current user id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      const { error } = await supabase.from("milestone_reports").insert({
        milestone_id: milestoneId!,
        contract_id: contractId!,
        submitted_by: user.id,
        description,
        amount_done: amountDone,
        img_path: null,
      });
      if (error) throw error;

      setDescription("");
      setAmountDone(0);
      setShowForm(false);
      // refetch by reloading — or wire a refresh callback if preferred
      window.location.reload();
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
          <h1 className="text-2xl font-semibold">
            تقارير المرحلة: {milestone.title}
          </h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {milestone.contracts.work_requests.title} ·{" "}
            {milestone.contracts.projects.name}
          </h4>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة تقرير
        </Button>
      </div>

      {/* progress summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-6 flex-wrap">
        <div className="text-sm text-gray-500">
          قيمة المرحلة:{" "}
          <span className="font-semibold text-gray-900">
            {formatCurrency(milestone.amount)}
          </span>
        </div>
        <span className="text-gray-300">·</span>
        <div className="text-sm text-gray-500">
          المنجز:{" "}
          <span className="font-semibold text-green-600">
            {formatCurrency(totalReported)}
          </span>
        </div>
        <span className="text-gray-300">·</span>
        <div className="text-sm text-gray-500">
          المتبقي:{" "}
          <span className="font-semibold text-orange-600">
            {formatCurrency(remaining)}
          </span>
        </div>
        <span className="text-gray-300">·</span>
        <div className="text-sm text-gray-500">
          عدد التقارير:{" "}
          <span className="font-semibold text-gray-900">
            {milestone.milestone_reports.length}
          </span>
        </div>
      </div>

      {/* add report form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">تقرير جديد</h2>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                المبلغ المنجز <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                min={0}
                max={remaining}
                className={inputClass}
                value={amountDone || ""}
                onChange={(e) => setAmountDone(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400">
                الحد الأقصى: {formatCurrency(remaining)}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                <Upload className="w-3.5 h-3.5 inline ml-1" />
                صورة (قريباً)
              </label>
              <input
                type="file"
                disabled
                className={`${inputClass} opacity-40 cursor-not-allowed`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              الوصف <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="وصف ما تم إنجازه..."
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              disabled={!description || amountDone <= 0 || saving}
              onClick={handleSubmitReport}
            >
              {saving ? "جاري الحفظ..." : "حفظ التقرير"}
            </Button>
            <Button
              variant="primary-outline"
              onClick={() => setShowForm(false)}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* reports table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          التقارير ({milestone.milestone_reports.length})
        </h2>
        <Separator />
        {milestone.milestone_reports.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-6 text-center">
            لا توجد تقارير بعد
          </p>
        ) : (
          <GenericTable
            data={milestone.milestone_reports}
            columns={MilestoneReportsColumns}
            enableSorting
          />
        )}
      </div>
    </div>
  );
};

export default MilestoneReportsPage;
