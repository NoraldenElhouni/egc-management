import { Link, useNavigate, useParams } from "react-router-dom";
import { useWorkRequest } from "../../../../../../hooks/operations/contracts/requests/useRequests";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Button from "../../../../../../components/ui/Button";
import OverviewStatus from "../../../../../../components/ui/OverviewStatus";
import { Calendar, Hash, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import Badge, { StatusBadge } from "../../../../../../components/ui/Badge";
import GenericTable from "../../../../../../components/tables/table";
import { BidsColumns } from "../../../../../../components/tables/columns/operations/contracts/bidsColumns";

const BidsListPage = () => {
  const navigate = useNavigate();
  const { projectId, requestId } = useParams<{
    projectId: string;
    requestId: string;
  }>();

  // ✅ Hook must be called unconditionally — moved before the early return
  const { error, loading, workRequest, bids, lowestBid, highestBid } =
    useWorkRequest(requestId ?? "");

  if (!requestId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No request Id found</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingPage label="Loading project details..." />;
  }

  if (error) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المشروع"
        error={error.message}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-6">العروض المستلمة</h1>
          <h4 className="text-sm font-semibold mb-6 text-gray-500">
            طلب: {workRequest?.title} - {workRequest?.projects.name} -{" "}
            <span>{workRequest?.status}</span>
          </h4>
        </div>
        <div>
          <Button variant="primary-outline">إغلاق الطلب</Button>
        </div>
      </div>

      <div>
        <OverviewStatus
          stats={[
            {
              label: "العروض المستلمة",
              value: String(workRequest?.bids_count ?? 0),
              icon: Hash,
              iconBgColor: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              label: "أقل عرض",
              value: lowestBid !== null ? formatCurrency(lowestBid) : "—",
              icon: TrendingDown,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "أعلى عرض",
              value: highestBid !== null ? formatCurrency(highestBid) : "—",
              icon: TrendingUp,
              iconBgColor: "bg-red-100",
              iconColor: "text-red-600",
            },
            {
              label: "آخر موعد للعروض",
              value: formatDate(workRequest?.bid_deadline),
              icon: Calendar,
              iconBgColor: "bg-orange-100",
              iconColor: "text-orange-600",
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <div>
          <p>
            {workRequest?.title} - {workRequest?.projects.name}
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-1 text-sm text-gray-500">
            {workRequest?.mode === "open" ? (
              <StatusBadge.Open label="مفتوح — جميع المقاولين" />
            ) : (
              <StatusBadge.Direct label="خاص — لمقاول واحد" />
            )}

            <span>·</span>

            <Badge
              label={workRequest?.specializations.name ?? "-"}
              variant="outline"
            />

            <span>·</span>

            <Badge
              label={`${workRequest?.work_request_items.length ?? 0} بنود`}
              variant="default"
            />

            <span>·</span>

            <Badge label={workRequest?.projects.name ?? "-"} variant="info" />
          </div>
        </div>
        <div>
          <Button onClick={() => navigate(-1)}>تفاصيل الطلب</Button>
        </div>
      </div>

      <div>
        <GenericTable
          data={bids ?? []}
          columns={BidsColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      </div>
    </div>
  );
};

export default BidsListPage;
