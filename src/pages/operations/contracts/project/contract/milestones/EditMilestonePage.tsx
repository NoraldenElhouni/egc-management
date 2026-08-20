import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Separator from "../../../../../../components/ui/separator";
import Button from "../../../../../../components/ui/Button";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import { Info } from "lucide-react";
import {
  useMilestone,
  useUpdateMilestoneDetails,
} from "../../../../../../hooks/operations/contracts/useMilestone";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const labelClass = "text-sm font-medium text-gray-700";

const EditMilestonePage = () => {
  const navigate = useNavigate();
  const { milestoneId } = useParams<{ milestoneId: string }>();

  const { milestone, loading, error } = useMilestone(milestoneId ?? "");
  const { updateMilestoneDetails, loading: saving } =
    useUpdateMilestoneDetails();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? "");
      setDueDate(milestone.due_date ?? "");
    }
  }, [milestone]);

  if (!milestoneId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات المرحلة..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!milestone) return null;

  if (milestone.status === "done") {
    return (
      <ErrorPage
        label="لا يمكن تعديل مرحلة مكتملة"
        error="تم تعليم هذه المرحلة كمكتملة بالفعل."
      />
    );
  }

  const canSave = !!title && !saving;

  async function handleSave() {
    if (!canSave || !milestoneId) return;
    setSaveError(null);
    const { error } = await updateMilestoneDetails(milestoneId, {
      title,
      description: description || null,
      due_date: dueDate || null,
    });
    if (error) {
      setSaveError(error.message ?? "حدث خطأ أثناء الحفظ");
      return;
    }
    navigate(-1);
  }

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">تعديل المرحلة</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {milestone.contracts.rounds?.title ?? "—"} ·{" "}
            {milestone.contracts.project?.name ?? "—"}
          </h4>
        </div>
      </div>

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

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>تاريخ الاستحقاق</label>
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Separator />

            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="primary" disabled={!canSave} onClick={handleSave}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button variant="primary-outline" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>

        {/* right — note */}
        <div className="space-y-3">
          <div className="rounded-lg shadow-sm p-4 flex gap-3 items-start bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700">
              لا يمكن تعديل المبلغ أو النسبة بعد إنشاء المرحلة، حفاظاً على أن
              يظل مجموع نسب المراحل مساوياً لـ 100% من قيمة العقد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMilestonePage;
