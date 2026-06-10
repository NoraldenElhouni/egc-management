import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../../../components/ui/Button";
import { Ban, Check, Info, StickyNote } from "lucide-react";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import GenericTable from "../../../../../../components/tables/table";
import { StatusBadge } from "../../../../../../components/ui/Badge";
import { useBidDetail } from "../../../../../../hooks/operations/contracts/requests/useRequests";
import { BidItemsColumns } from "../../../../../../components/tables/columns/operations/bidItemsColumns";
import AcceptBidDialog from "../../../../../../components/dialog/AcceptBidDialog";
import { RequestBids } from "../../../../../../types/contracts.type";
import { supabase } from "../../../../../../lib/supabaseClient";

const BidDetailPage = () => {
  const { bidId } = useParams<{ bidId: string }>();

  const { bid, loading, error } = useBidDetail(bidId ?? "");
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [declining, setDeclining] = useState(false);
  const navigate = useNavigate();

  async function handleDecline() {
    if (!bid) return;
    setDeclining(true);
    await supabase
      .from("contractor_bids")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", bid.id);
    setDeclining(false);
    navigate(0);
  }

  if (!bidId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No bid Id found</p>
      </div>
    );
  }

  if (loading) return <LoadingPage label="جاري تحميل تفاصيل العرض..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل العرض" error={error.message} />
    );
  if (!bid) return null;

  const isPending = bid.status === "pending";
  const contractorName = `${bid.contractors.first_name} ${bid.contractors.last_name ?? ""}`;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل العرض</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {bid.work_requests.title} · {bid.work_requests.projects.name}
          </h4>
        </div>
        {isPending && (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="error"
              disabled={declining}
              onClick={handleDecline}
            >
              <Ban className="w-4 h-4 ml-2" />
              {declining ? "جاري الرفض..." : "رفض العرض"}
            </Button>
            <Link to={`./counter/new`}>
              <Button size="sm" variant="warning">
                <Info className="w-4 h-4 ml-2" />
                عرض مضاد
              </Button>
            </Link>
            <Button
              size="sm"
              variant="success"
              onClick={() => setShowAcceptDialog(true)}
            >
              <Check className="w-4 h-4 ml-2" />
              قبول العرض وإنشاء العقد
            </Button>
          </div>
        )}
        {!isPending && (
          <div>
            {bid.status === "accepted" && <StatusBadge.Awarded />}
            {bid.status === "rejected" && <StatusBadge.Rejected />}
            {bid.status === "withdrawn" && <StatusBadge.Cancelled />}
          </div>
        )}
      </div>

      {/* cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* contractor info */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex gap-3 items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {bid.contractors.first_name.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{contractorName}</h2>
              <p className="text-xs text-gray-400">
                {bid.contractors.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <Separator />
          <InfoRow
            label="رقم الهاتف"
            value={bid.contractors.phone_number ?? "—"}
          />
          <InfoRow
            label="البريد الإلكتروني"
            value={bid.contractors.email ?? "—"}
            bordered={false}
          />
        </div>

        {/* bid summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">ملخص العرض</h2>
          <Separator />
          <InfoRow label="تاريخ التقديم" value={formatDate(bid.submitted_at)} />
          <InfoRow label="المدة المطلوبة" value={`${bid.days_needed} يوم`} />
          <InfoRow
            label="عدد البنود المسعّرة"
            value={`${bid.contractor_bid_items.length} بند`}
          />
          <InfoRow
            label="الحالة"
            value={
              <>
                {bid.status === "pending" && <StatusBadge.Pending />}
                {bid.status === "accepted" && <StatusBadge.Awarded />}
                {bid.status === "rejected" && <StatusBadge.Rejected />}
                {bid.status === "withdrawn" && <StatusBadge.Cancelled />}
              </>
            }
            bordered={false}
          />
        </div>
      </div>

      {/* notes */}
      {bid.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">ملاحظات المقاول</h2>
          <Separator />
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">ملاحظات</h3>
            </div>
            <p className="text-sm leading-7 text-gray-700">{bid.notes}</p>
          </div>
        </div>
      )}

      {/* items table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">بنود العرض</h2>
        <Separator />
        <GenericTable
          data={bid.contractor_bid_items}
          columns={BidItemsColumns}
          enableSorting
        />
      </div>

      {/* footer */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">إجمالي العرض</p>
          <p className="font-bold text-2xl mt-1">
            {formatCurrency(bid.total_price)}
          </p>
          {isPending && (
            <p className="text-sm text-gray-400 mt-1">
              قبول العرض سيُنشئ عقداً تلقائياً مع هذا المقاول
            </p>
          )}
        </div>
        {isPending && (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="error"
              disabled={declining}
              onClick={handleDecline}
            >
              <Ban className="w-4 h-4 ml-2" />
              {declining ? "جاري الرفض..." : "رفض العرض"}
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => setShowAcceptDialog(true)}
            >
              <Check className="w-4 h-4 ml-2" />
              قبول العرض وإنشاء العقد
            </Button>
          </div>
        )}
      </div>
      {showAcceptDialog && (
        <AcceptBidDialog
          bid={bid as unknown as RequestBids}
          onClose={() => setShowAcceptDialog(false)}
          onSuccess={() => {
            setShowAcceptDialog(false);
            navigate(0); // re-runs the current route loader, re-fetches data
          }}
        />
      )}
    </div>
  );
};

export default BidDetailPage;
