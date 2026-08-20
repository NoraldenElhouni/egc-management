import React from "react";
import { useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { CheckCircle2, Ban, StickyNote } from "lucide-react";
import Badge, { StatusBadge } from "../../../components/ui/Badge";
import OverviewStatus from "../../../components/ui/OverviewStatus";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import Separator from "../../../components/ui/separator";
import InfoRow from "../../../components/ui/InfoRow";
import RequestTimeline from "../../../components/ui/TimelineStep";
import GenericTable from "../../../components/tables/table";
import { useOrderDetails } from "../../../hooks/shop/orders/useOrderDetails";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import { OrderItemsColumns } from "../../../components/tables/columns/shops/orders/OrderItemsColumns";

const timelineSteps = (
  order: NonNullable<ReturnType<typeof useOrderDetails>["order"]>,
) => {
  const steps = [
    {
      title: "تم إنشاء الطلب",
      subtitle: formatDate(order.created_at),
      status: "done" as const,
    },
    {
      title: "تم التسعير",
      subtitle: order.quoted_at
        ? formatDate(order.quoted_at)
        : "بانتظار عروض الموردين",
      status: order.quoted_at
        ? ("done" as const)
        : order.status === "cancelled" || order.status === "rejected"
          ? ("pending" as const)
          : ("current" as const),
    },
    {
      title: "تمت الموافقة",
      subtitle: order.approved_at
        ? formatDate(order.approved_at)
        : "بانتظار موافقة المالية",
      status: order.approved_at ? ("done" as const) : ("pending" as const),
    },
    {
      title: "تم الاستلام",
      subtitle: order.arrived_at
        ? formatDate(order.arrived_at)
        : "لم يتم الاستلام بعد",
      status: order.arrived_at ? ("done" as const) : ("pending" as const),
    },
  ];

  return steps;
};

const OrderDetailsPage = () => {
  const { orderId } = useParams<{
    orderId: string;
  }>();

  const { order, loading, error } = useOrderDetails(orderId);

  if (!orderId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No order Id found</p>
      </div>
    );
  }

  if (loading) return <LoadingPage label="جاري تحميل تفاصيل الطلب..." />;
  if (error)
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات الطلب"
        error={error.message}
      />
    );
  if (!order) return null;

  const creatorName = order.created_by_user
    ? `${order.created_by_user.first_name} ${order.created_by_user.last_name ?? ""}`.trim()
    : "—";

  const approverName = order.approved_by_user
    ? `${order.approved_by_user.first_name} ${order.approved_by_user.last_name ?? ""}`.trim()
    : null;

  return (
    <div className="p-6">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل الطلب</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            #{order.id.slice(0, 8)} · {order.project?.name ?? "—"}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {order.status === "quoted" && (
            <Button size="sm">
              <CheckCircle2 className="w-4 h-4 ml-2" />
              الموافقة على الطلب
            </Button>
          )}

          {order.status !== "cancelled" &&
            order.status !== "rejected" &&
            order.status !== "arrived" && (
              <Button size="sm" variant="error">
                <Ban className="w-4 h-4 ml-2" />
                إلغاء الطلب
              </Button>
            )}
        </div>
      </div>

      <div className="space-y-4">
        {/* overview bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center flex-wrap gap-2">
            {order.status === "pending" && <StatusBadge.Pending />}
            {order.status === "quoted" && <StatusBadge.Bidding />}
            {order.status === "approved" && <StatusBadge.Awarded />}
            {order.status === "arrived" && <StatusBadge.Completed />}
            {order.status === "cancelled" && <StatusBadge.Cancelled />}
            {order.status === "rejected" && <StatusBadge.Cancelled />}

            <Badge label={`${order.items.length} عنصر`} />

            {order.vendor?.vendor_name && (
              <Badge
                label={`المورد: ${order.vendor.vendor_name}`}
                variant="info"
              />
            )}
          </div>
        </div>

        {/* stats */}
        <OverviewStatus
          stats={[
            { label: "المشروع", value: order.project?.name ?? "—" },
            { label: "عدد العناصر", value: order.items.length },
            {
              label: "الإجمالي",
              value:
                order.total_price != null
                  ? formatCurrency(order.total_price)
                  : "—",
            },
          ]}
        />

        {/* three-panel section */}
        <div className="grid grid-cols-5 gap-4">
          {/* general info — 2/5 */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">المعلومات العامة</h2>
            <Separator />
            <InfoRow label="المشروع" value={order.project?.name ?? "—"} />
            <InfoRow label="أنشئ بواسطة" value={creatorName} />
            <InfoRow label="المورد" value={order.vendor?.vendor_name ?? "—"} />
            <InfoRow label="مرجع المورد" value={order.vendor_ref ?? "—"} />
            <InfoRow
              label="الإجمالي"
              value={
                order.total_price != null
                  ? formatCurrency(order.total_price)
                  : "—"
              }
            />
            <InfoRow
              label="تاريخ الإنشاء"
              value={formatDate(order.created_at)}
            />
            {approverName && (
              <InfoRow
                label="تمت الموافقة بواسطة"
                value={approverName}
                bordered={false}
              />
            )}
          </div>

          {/* notes — 2/5 */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900">الملاحظات</h2>
            <Separator />

            {order.note ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">
                    ملاحظات الطلب
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-700">{order.note}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">لا توجد ملاحظات</p>
            )}
          </div>

          {/* timeline — 1/5 */}
          <div className="col-span-1">
            <RequestTimeline steps={timelineSteps(order)} />
          </div>
        </div>

        {/* items table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">عناصر الطلب</h2>
          <Separator />
          <GenericTable
            data={order.items}
            columns={OrderItemsColumns}
            enableSorting
          />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
