// MilestonePage.tsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useMilestone } from "../../../../../../hooks/operations/contracts/useMilestone";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import { StatusBadge } from "../../../../../../components/ui/Badge";
import Button from "../../../../../../components/ui/Button";
import OverviewStatus from "../../../../../../components/ui/OverviewStatus";
import { CheckCircle, Pencil } from "lucide-react";
import { MilestoneDetail } from "../../../../../../hooks/operations/contracts/useMilestone";

const milestoneStatusBadge = (status: MilestoneDetail["status"]) => {
  switch (status) {
    case "done":
      return <StatusBadge.Completed />;
    case "in_progress":
      return <StatusBadge.Active />;
    default:
      return <StatusBadge.Pending />;
  }
};

const MilestonePage = () => {
  const { milestoneId } = useParams<{
    milestoneId: string;
    contractId: string;
    projectId: string;
  }>();

  const { milestone, loading, error, paid, remaining } = useMilestone(
    milestoneId ?? "",
  );

  if (!milestoneId) return null;
  if (loading) return <LoadingPage label="جاري تحميل تفاصيل المرحلة..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!milestone) return null;

  const progressPercent =
    milestone.amount > 0
      ? Math.min(Math.round((paid / milestone.amount) * 100), 100)
      : 0;
  const isPending = milestone.status === "pending";
  const contractorName = milestone.contracts.contractor
    ? `${milestone.contracts.contractor.first_name} ${milestone.contracts.contractor.last_name ?? ""}`
    : "—";

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{milestone.title}</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {milestone.contracts.rounds?.title ?? "—"} · {contractorName} ·{" "}
            {milestone.contracts.project?.name ?? "—"}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <Link to="edit">
            <Button size="sm" variant="primary-outline">
              <Pencil className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          </Link>
          {isPending && (
            <Button size="sm" variant="success">
              <CheckCircle className="w-4 h-4 ml-2" />
              تأكيد الإنجاز
            </Button>
          )}
        </div>
      </div>

      {/* overview bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 flex-wrap">
        {milestoneStatusBadge(milestone.status)}
        {milestone.due_date && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              تاريخ الاستحقاق: {formatDate(milestone.due_date)}
            </span>
          </>
        )}
        {milestone.completed_at && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              اكتمل في: {formatDate(milestone.completed_at)}
            </span>
          </>
        )}
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-500">
          النسبة: {milestone.percentage}%
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-500">
          الترتيب: {milestone.order_index}
        </span>
      </div>

      {/* stats */}
      <OverviewStatus
        stats={[
          {
            label: "قيمة المرحلة",
            value: formatCurrency(milestone.amount),
          },
          {
            label: "المدفوع حتى الآن",
            value: formatCurrency(paid),
            secondaryLabel: "نسبة الإنجاز",
            secondaryValue: `${progressPercent}%`,
          },
          {
            label: "المتبقي",
            value: formatCurrency(remaining),
          },
        ]}
      />

      {/* details card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900">تفاصيل المرحلة</h2>
        <Separator />
        <InfoRow label="العنوان" value={milestone.title} />
        <InfoRow
          label="الحالة"
          value={milestoneStatusBadge(milestone.status)}
        />
        <InfoRow label="القيمة" value={formatCurrency(milestone.amount)} />
        <InfoRow label="النسبة" value={`${milestone.percentage}%`} />
        <InfoRow
          label="تاريخ الاستحقاق"
          value={milestone.due_date ? formatDate(milestone.due_date) : "—"}
        />
        <InfoRow
          label="تاريخ الإنشاء"
          value={formatDate(milestone.created_at)}
        />
        <InfoRow
          label="الوصف"
          value={milestone.description ?? "—"}
          bordered={false}
        />
      </div>

      {/* progress bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-900">نسبة الإنجاز</h2>
          <span className="text-sm font-medium text-gray-600">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{formatCurrency(paid)} مدفوع</span>
          <span>{formatCurrency(remaining)} متبقي</span>
        </div>
      </div>
    </div>
  );
};

export default MilestonePage;
