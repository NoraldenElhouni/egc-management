import { Link, useParams } from "react-router-dom";
import { useBidsByRequest } from "../../../../../../hooks/operations/contracts/requests/useRequests";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Button from "../../../../../../components/ui/Button";
import OverviewStatus from "../../../../../../components/ui/OverviewStatus";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import Badge, { StatusBadge } from "../../../../../../components/ui/Badge";
import GenericTable from "../../../../../../components/tables/table";
import { getBidsColumns } from "../../../../../../components/tables/columns/operations/contracts/bidsColumns";

const BidsListPage = () => {
  const { requestId } = useParams<{ requestId: string }>();

  const { error, loading, workRequest, bids, lowestBid, highestBid } =
    useBidsByRequest(requestId ?? "");

  if (!requestId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No request Id found</p>
      </div>
    );
  }

  if (loading) return <LoadingPage label="جاري تحميل العروض..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل البيانات" error={error.message} />
    );

  const columns = getBidsColumns(() => window.location.reload());

  const canClose =
    workRequest?.status === "open" || workRequest?.status === "bidding";
  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">العروض المستلمة</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">
              {workRequest?.title} · {workRequest?.projects.name}
            </span>
            {workRequest?.status === "open" && <StatusBadge.Bidding />}
            {workRequest?.status === "awarded" && <StatusBadge.Awarded />}
            {workRequest?.status === "cancelled" && <StatusBadge.Cancelled />}
            {workRequest?.status === "draft" && <StatusBadge.Pending />}
            {workRequest?.status === "bidding" && <StatusBadge.Bidding />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to=".." relative="path">
            <Button variant="primary-outline">تفاصيل الطلب</Button>
          </Link>
          {canClose && <Button variant="error">إغلاق الطلب</Button>}
        </div>
      </div>

      {/* stats */}
      <OverviewStatus
        stats={[
          {
            label: "العروض المستلمة",
            value: workRequest?.bids_count ?? 0,
          },
          {
            label: "أقل عرض",
            value: lowestBid !== null ? formatCurrency(lowestBid) : "—",
          },
          {
            label: "أعلى عرض",
            value: highestBid !== null ? formatCurrency(highestBid) : "—",
          },
          {
            label: "آخر موعد للعروض",
            value: formatDate(workRequest?.bid_deadline),
          },
        ]}
      />

      {/* request info card */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-xs text-gray-400 mb-2 font-medium">معلومات الطلب</p>
        <p className="font-semibold text-gray-900 mb-2">
          {workRequest?.title} — {workRequest?.projects.name}
        </p>
        <div className="flex items-center flex-wrap gap-2">
          {workRequest?.mode === "open" ? (
            <StatusBadge.Open label="مفتوح — جميع المقاولين" />
          ) : (
            <StatusBadge.Direct label="خاص — لمقاول واحد" />
          )}
          <Badge
            label={workRequest?.specializations.name ?? "—"}
            variant="purple"
          />

          <Badge
            label={`${workRequest?.work_request_items.length ?? 0} بنود`}
          />

          <Badge label={workRequest?.projects.name ?? "—"} />
        </div>
      </div>

      {/* bids table */}
      <GenericTable
        data={bids ?? []}
        columns={columns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default BidsListPage;
