import React from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../../../components/ui/Button";
import {
  Ban,
  Briefcase,
  FileText,
  ListOrdered,
  Pencil,
  Send,
  StickyNote,
  Trash,
  TrendingDown,
} from "lucide-react";
import Badge, { StatusBadge } from "../../../../../components/ui/Badge";
import OverviewStatus from "../../../../../components/ui/OverviewStatus";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import Separator from "../../../../../components/ui/separator";
import InfoRow from "../../../../../components/ui/InfoRow";
import RequestTimeline from "../../../../../components/ui/TimelineStep";
import GenericTable from "../../../../../components/tables/table";
import { WorkRequestItemsColumns } from "../../../../../components/tables/columns/operations/contracts/workRequestItemsColumns";
import { useWorkRequest } from "../../../../../hooks/operations/contracts/requests/useRequests";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../components/ui/errorPage";
import AttachmentsPreview from "../../../../../components/ui/AttachmentsPreview";
import { useCreateRequest } from "../../../../../hooks/operations/contracts/useContracts";

const timelineSteps = (
  workRequest: NonNullable<ReturnType<typeof useWorkRequest>["workRequest"]>,
) => [
  {
    title: "تم إنشاء الطلب",
    subtitle: formatDate(workRequest.created_at),
    status: "done" as const,
  },
  // {
  //   title: "تم نشر الطلب — إشعار المقاولين",
  //   subtitle:
  //     workRequest.status !== "draft"
  //       ? formatDate(workRequest.created_at)
  //       : undefined,
  //   status:
  //     workRequest.status !== "draft" ? ("done" as const) : ("pending" as const),
  // },
  // {
  //   title: "الموعد النهائي لاستلام العروض",
  //   subtitle: workRequest.bid_deadline
  //     ? formatDate(workRequest.bid_deadline)
  //     : "—",
  //   status:
  //     workRequest.status === "open"
  //       ? ("current" as const)
  //       : workRequest.status === "draft"
  //         ? ("pending" as const)
  //         : ("done" as const),
  // },
  // {
  //   title: "قبول عرض وإنشاء العقد",
  //   subtitle:
  //     workRequest.status === "awarded"
  //       ? "تم قبول العرض"
  //       : "في انتظار قرار المهندس",
  //   status:
  //     workRequest.status === "awarded"
  //       ? ("done" as const)
  //       : ("pending" as const),
  // },
];

const ContractRequestDetailsPage = () => {
  const { requestId } = useParams<{ requestId: string }>();

  const { error, loading, workRequest, bids } = useWorkRequest(requestId ?? "");
  const {
    publishRequest,
    stopRequest,
    cancelRequest,
    loading: requestLoading,
  } = useCreateRequest();

  if (!requestId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No request Id found</p>
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
  if (!workRequest) return null;

  const lowestBid = bids?.length
    ? formatCurrency(Math.min(...bids.map((b) => Number(b.total_price))))
    : "—";

  const lowestPrice = bids?.length
    ? Math.min(...bids.map((b) => Number(b.total_price)))
    : null;

  const highestPrice = bids?.length
    ? Math.max(...bids.map((b) => Number(b.total_price)))
    : null;

  return (
    <div className="p-6">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل الطلب</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {workRequest.title} · {workRequest.projects.name}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {/* ── DRAFT STATE ───────────────────────────── */}
          {workRequest.status === "draft" && (
            <>
              <Button
                size="sm"
                disabled={requestLoading}
                onClick={async () => {
                  const { error } = await publishRequest(workRequest.id);

                  if (error) {
                    alert("حدث خطأ أثناء نشر الطلب");
                    return;
                  }

                  window.location.reload();
                }}
              >
                <Send className="w-4 h-4 ml-2" />
                نشر الطلب
              </Button>

              <Link to={"./edit"}>
                <Button size="sm" variant="primary-outline">
                  <Pencil className="w-4 h-4 ml-2" />
                  تعديل الطلب
                </Button>
              </Link>

              <Link to={"./bids"}>
                <Button size="sm" variant="info">
                  <FileText className="w-4 h-4 ml-2" />
                  العروض المستلمة ({workRequest.bids_count})
                </Button>
              </Link>
            </>
          )}

          {/* ── OPEN STATE ───────────────────────────── */}
          {workRequest.status === "open" && (
            <>
              <Button
                size="sm"
                variant="error"
                disabled={requestLoading}
                onClick={async () => {
                  const { error } = await stopRequest(workRequest.id);

                  if (error) {
                    alert("حدث خطأ أثناء إيقاف الطلب");
                    return;
                  }

                  window.location.reload();
                }}
              >
                <Ban className="w-4 h-4 ml-2" />
                إيقاف الطلب
              </Button>

              <Link to={"./edit"}>
                <Button size="sm" variant="primary-outline">
                  <Pencil className="w-4 h-4 ml-2" />
                  تعديل الطلب
                </Button>
              </Link>

              <Link to={"./bids"}>
                <Button size="sm" variant="info">
                  <FileText className="w-4 h-4 ml-2" />
                  العروض المستلمة ({workRequest.bids_count})
                </Button>
              </Link>
            </>
          )}

          {/* ── cancelled / STOPPED STATE ─────────────── */}
          {workRequest.status === "cancelled" && (
            <Link to={"./bids"}>
              <Button size="sm" variant="info">
                <FileText className="w-4 h-4 ml-2" />
                العروض المستلمة ({workRequest.bids_count})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* overview bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center flex-wrap gap-2">
            {workRequest.status === "open" && <StatusBadge.Bidding />}
            {workRequest.status === "awarded" && <StatusBadge.Awarded />}
            {workRequest.status === "cancelled" && <StatusBadge.Cancelled />}
            {workRequest.status === "draft" && <StatusBadge.Pending />}
            {workRequest.status === "closed" && <StatusBadge.Completed />}
            <Badge label={`العروض المستلمة ${workRequest.bids_count}`} />
            {workRequest.bid_deadline && (
              <Badge
                label={`الموعد النهائي ${formatDate(workRequest.bid_deadline)}`}
              />
            )}
            <Badge
              label={workRequest.mode === "open" ? "مفتوح" : "خاص"}
              variant={workRequest.mode === "open" ? "success" : "default"}
            />
            <Badge
              label={
                workRequest.contractor_provides_materials
                  ? "المقاول يوفر المواد"
                  : "المواد على العميل"
              }
              variant={
                workRequest.contractor_provides_materials ? "info" : "default"
              }
            />
          </div>
          {workRequest.status !== "cancelled" && (
            <Button
              size="sm"
              variant="error"
              disabled={requestLoading}
              onClick={async () => {
                const { error } = await cancelRequest(workRequest.id);

                if (error) {
                  alert("حدث خطأ أثناء إيقاف الطلب");
                  return;
                }

                window.location.reload();
              }}
            >
              <Trash className="w-4 h-4 ml-2" />
              إلغاء الطلب
            </Button>
          )}
        </div>

        {/* stats */}
        <OverviewStatus
          stats={[
            {
              label: "التخصص",
              value: workRequest.specializations.name,
              icon: Briefcase,
              iconBgColor: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              label: "عدد البنود",
              value: workRequest.work_request_items.length,
              icon: ListOrdered,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "أقل عرض حتى الآن",
              value: lowestBid,
              icon: TrendingDown,
              iconBgColor: "bg-orange-100",
              iconColor: "text-orange-600",
            },
          ]}
        />

        {/* three-panel section */}
        <div className="grid grid-cols-5 gap-4">
          {/* general info — 2/5 */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">المعلومات العامة</h2>
            <Separator />
            <InfoRow label="المشروع" value={workRequest.projects.name} />
            <InfoRow
              label="نوع العقد"
              value={
                workRequest.mode === "open" ? (
                  <StatusBadge.Open />
                ) : (
                  <StatusBadge.Direct />
                )
              }
            />
            {workRequest.mode === "direct" && workRequest.contractors && (
              <>
                <InfoRow
                  label="المقاول المباشر"
                  value={`${workRequest.contractors.first_name} ${workRequest.contractors.last_name ?? ""}`}
                />
                {workRequest.contractors.phone_number && (
                  <InfoRow
                    label="هاتف المقاول"
                    value={workRequest.contractors.phone_number}
                  />
                )}
              </>
            )}
            <InfoRow
              label="تاريخ الإنشاء"
              value={formatDate(workRequest.created_at)}
            />
            <InfoRow
              label="آخر موعد للعروض"
              value={
                workRequest.bid_deadline
                  ? formatDate(workRequest.bid_deadline)
                  : "—"
              }
            />
            <InfoRow
              label="تاريخ بدء العمل المتوقع"
              value={
                workRequest.work_start_at
                  ? formatDate(workRequest.work_start_at)
                  : "—"
              }
            />
            <InfoRow label="التخصص" value={workRequest.specializations.name} />
            <InfoRow
              label="المواد"
              value={
                workRequest.contractor_provides_materials
                  ? "يوفرها المقاول"
                  : "على عاتق صاحب العمل"
              }
            />
            <InfoRow
              label="أُنشئ بواسطة"
              value={`${workRequest.employees.first_name} ${workRequest.employees.last_name ?? ""}`}
              bordered={false}
            />
          </div>

          {/* notes + bids — 2/5 */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900">الوصف والشروط</h2>
            <Separator />

            {/* description */}
            {workRequest.description ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">
                    وصف الطلب
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-700">
                  {workRequest.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">لا يوجد وصف</p>
            )}

            {/* delay penalty */}
            {workRequest.delay_penalty_terms ? (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-800">
                    شروط غرامة التأخير
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-700">
                  {workRequest.delay_penalty_terms}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                لا توجد شروط غرامة تأخير
              </p>
            )}

            {/* retention terms */}
            {workRequest.retention_terms ? (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-800">
                    شروط الاستقطاع
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-700">
                  {workRequest.retention_terms}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                لا توجد شروط استقطاع
              </p>
            )}

            <Separator />

            {/* contact info */}
            <div>
              <h2 className="font-semibold text-sm text-gray-900 mb-3">
                معلومات التواصل
              </h2>
              {workRequest.contact_name || workRequest.contact_phone ? (
                <div className="p-4 rounded-xl border bg-gray-50 space-y-2">
                  {workRequest.contact_name && (
                    <InfoRow
                      label="اسم جهة التواصل"
                      value={workRequest.contact_name}
                      bordered={false}
                    />
                  )}
                  {workRequest.contact_phone && (
                    <InfoRow
                      label="رقم التواصل"
                      value={workRequest.contact_phone}
                      bordered={false}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  لا توجد معلومات تواصل
                </p>
              )}
            </div>

            <Separator />

            {/* bids summary */}
            <div className="p-4 rounded-xl border bg-white">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">
                العروض المقدمة ({workRequest.bids_count})
              </h2>
              {workRequest.bids_count === 0 ? (
                <p className="text-sm text-gray-400">
                  لم يتم استلام أي عروض بعد
                </p>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    تم استلام {workRequest.bids_count} عرض — اضغط على "العروض
                    المستلمة" لعرض التفاصيل
                  </p>
                  <Separator />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {bids?.map((bid) => {
                      const price = Number(bid.total_price);
                      const variant =
                        price === lowestPrice
                          ? "success"
                          : price === highestPrice
                            ? "danger"
                            : "default";
                      return (
                        <Badge
                          key={bid.id}
                          variant={variant}
                          label={`${bid.contractors.first_name} ${bid.contractors.last_name} - ${formatCurrency(price)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* timeline — 1/5 */}
          <div className="col-span-1">
            <RequestTimeline steps={timelineSteps(workRequest)} />
          </div>
        </div>

        {/* items table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">بنود الطلب</h2>
          <Separator />
          <GenericTable
            data={workRequest.work_request_items}
            columns={WorkRequestItemsColumns}
            enableSorting
          />
        </div>

        {/* attachments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">المرفقات</h2>
          <Separator />
          <AttachmentsPreview attachments={workRequest.attachments ?? []} />
        </div>
      </div>
    </div>
  );
};

export default ContractRequestDetailsPage;
