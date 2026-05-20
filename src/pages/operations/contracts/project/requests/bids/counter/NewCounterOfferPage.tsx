import { useMemo, useState } from "react";
import { StickyNote } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useBidForNegotiation } from "../../../../../../../hooks/operations/contracts/requests/bids/negotiation/useBidNegotiation";
import LoadingPage from "../../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../../components/ui/errorPage";
import { supabase } from "../../../../../../../lib/supabaseClient";
import Separator from "../../../../../../../components/ui/separator";
import { formatCurrency } from "../../../../../../../utils/helpper";
import InfoRow from "../../../../../../../components/ui/InfoRow";
import Button from "../../../../../../../components/ui/Button";

const NewCounterOfferPage = () => {
  const navigate = useNavigate();
  const { bidId, requestId } = useParams<{
    bidId: string;
    requestId: string;
    projectId: string;
  }>();

  const { bid, loading, error } = useBidForNegotiation(bidId ?? "");

  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [daysNeeded, setDaysNeeded] = useState<number | null>(null);
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ✅ ALL derived values and useMemo BEFORE any early returns
  const items = useMemo(
    () =>
      bid?.contractor_bid_items.map((item) => ({
        ...item,
        newPrice: itemPrices[item.id] ?? item.unit_price,
      })) ?? [],
    [bid, itemPrices],
  );

  const summary = useMemo(() => {
    const originalTotal =
      bid?.contractor_bid_items.reduce(
        (acc, item) => acc + item.total_price,
        0,
      ) ?? 0;
    const calculatedTotal = items.reduce(
      (acc, item) => acc + item.newPrice * item.quantity,
      0,
    );
    const modifiedItems = items.filter(
      (item) => item.newPrice !== item.unit_price,
    ).length;
    return { originalTotal, calculatedTotal, modifiedItems };
  }, [items, bid]);

  // ✅ Now safe to do early returns
  if (!bidId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات العرض..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!bid) return null;

  const nextRound = bid.negotiation_round + 1;
  const contractorName = `${bid.contractors.first_name} ${bid.contractors.last_name ?? ""}`;
  const effectiveDays = daysNeeded ?? bid.days_needed;
  const finalTotal = manualTotal ?? summary.calculatedTotal;
  const isMaxRound = nextRound > 3;

  function handlePriceChange(itemId: string, value: string) {
    setItemPrices((prev) => ({ ...prev, [itemId]: Number(value) }));
    setManualTotal(null); // reset manual override when item prices change
  }

  async function handleSubmit() {
    if (nextRound > 3 || !bidId || !requestId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      // 1. Insert the negotiation round
      const { data: negotiation, error: negError } = await supabase
        .from("bid_negotiations")
        .insert({
          bid_id: bidId,
          request_id: requestId,
          round: nextRound,
          initiated_by: user.id,
          initiated_role: "engineer" as const, // fix: "company" doesn't exist in enum
          proposed_total: finalTotal,
          proposed_days: effectiveDays,
          note: note || null,
          status: "pending" as const,
        })
        .select()
        .single();

      if (negError) throw negError;

      // 2. Insert negotiation items
      const negotiationItems = items.map((item) => ({
        negotiation_id: negotiation.id,
        request_item_id: item.request_item_id,
        original_price: item.unit_price,
        proposed_price: item.newPrice,
        quantity: item.quantity,
        total_price: item.newPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("bid_negotiation_items")
        .insert(negotiationItems);

      if (itemsError) throw itemsError;

      // 3. Update bid negotiation round counter
      const { error: bidUpdateError } = await supabase
        .from("contractor_bids")
        .update({
          is_negotiating: true,
          negotiation_round: nextRound,
        })
        .eq("id", bidId);

      if (bidUpdateError) throw bidUpdateError;

      navigate(-1);
    } catch (err) {
      console.error(err);
      setSaveError("حدث خطأ أثناء الإرسال");
    }
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">إرسال عرض مضاد</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {bid.work_requests.title} · {bid.work_requests.projects.name} ·{" "}
            {contractorName} · الجولة {nextRound} من 3
          </h4>
        </div>
        {isMaxRound && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
            تم الوصول للحد الأقصى من جولات التفاوض (3 جولات)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT */}
        <div className="space-y-4">
          {/* contractor info */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-2">
              معلومات المقاول
            </h2>
            <Separator />

            <div className="flex gap-3 items-center my-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {bid.contractors.first_name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {contractorName}
                </h2>
                <p className="text-xs text-gray-400">
                  {bid.contractors.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between mt-3">
              <div>
                <p className="text-xs text-gray-400">العرض الأصلي</p>
                <p className="font-semibold">
                  {formatCurrency(bid.total_price)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">المدة الأصلية</p>
                <p className="font-semibold">{bid.days_needed} يوم</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">عدد البنود</p>
                <p className="font-semibold">
                  {bid.contractor_bid_items.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">جولة التفاوض</p>
                <p className="font-semibold">{nextRound} / 3</p>
              </div>
            </div>
          </div>

          {/* items table */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">
              تعديل الأسعار بنداً بند
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              عدّل السعر مباشرة في الخلية — الإجمالي يحتسب تلقائياً
            </p>
            <Separator />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3">البند</th>
                    <th className="text-center p-3">الكمية</th>
                    <th className="text-center p-3">الوحدة</th>
                    <th className="text-center p-3">السعر القديم</th>
                    <th className="text-center p-3">السعر الجديد</th>
                    <th className="text-center p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const total = item.quantity * item.newPrice;
                    const changed = item.newPrice !== item.unit_price;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b ${changed ? "bg-blue-50" : ""}`}
                      >
                        <td className="p-3 font-medium">
                          {item.work_request_items.services.name}
                          {item.work_request_items.description && (
                            <p className="text-xs text-gray-400">
                              {item.work_request_items.description}
                            </p>
                          )}
                        </td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-center p-3">{item.unit}</td>
                        <td className="text-center p-3 text-gray-400 line-through">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="text-center p-3">
                          <input
                            type="number"
                            value={item.newPrice}
                            onChange={(e) =>
                              handlePriceChange(item.id, e.target.value)
                            }
                            className={`w-28 border rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                              changed
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          />
                        </td>
                        <td className="text-center p-3 font-semibold">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* bottom controls */}
            <div className="my-6 border-t pt-4 flex items-end justify-between gap-4 flex-wrap">
              <div className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">
                    إجمالي العرض الجديد
                  </label>
                  <input
                    type="number"
                    value={finalTotal}
                    onChange={(e) => setManualTotal(Number(e.target.value))}
                    className="w-44 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-400">
                    محتسب: {formatCurrency(summary.calculatedTotal)}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">
                    المدة الجديدة (يوم)
                  </label>
                  <input
                    type="number"
                    value={effectiveDays}
                    onChange={(e) => setDaysNeeded(Number(e.target.value))}
                    className="w-32 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* note */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                ملاحظة للمقاول
              </label>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">
                    ملاحظة
                  </h3>
                </div>
                <textarea
                  rows={3}
                  placeholder="اكتب ملاحظتك للمقاول هنا..."
                  className="w-full bg-transparent text-sm leading-7 text-gray-700 focus:outline-none resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* previous negotiations */}
          {bid.bid_negotiations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-2">
                سجل التفاوض السابق
              </h2>
              <Separator />
              <div className="space-y-3 mt-3">
                {bid.bid_negotiations
                  .sort((a, b) => a.round - b.round)
                  .map((neg) => (
                    <div
                      key={neg.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          جولة {neg.round} —{" "}
                          {neg.initiated_role === "engineer"
                            ? "من الشركة"
                            : "من المقاول"}
                        </p>
                        {neg.note && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {neg.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(neg.proposed_total)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {neg.proposed_days} يوم
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — summary */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-fit">
            <h2 className="font-semibold text-gray-900">ملخص التعديل</h2>
            <Separator />
            <InfoRow
              label="العرض الأصلي"
              value={formatCurrency(bid.total_price)}
            />
            <InfoRow
              label="عرضك المقترح"
              value={
                <span className="font-semibold text-blue-600">
                  {formatCurrency(finalTotal)}
                </span>
              }
            />
            <InfoRow
              label="الفرق"
              value={
                <span
                  className={`font-semibold ${
                    finalTotal < bid.total_price
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {finalTotal < bid.total_price ? "−" : "+"}
                  {formatCurrency(Math.abs(finalTotal - bid.total_price))}
                </span>
              }
            />
            <InfoRow
              label="بنود معدّلة"
              value={`${summary.modifiedItems} / ${items.length}`}
            />
            <InfoRow label="المدة الأصلية" value={`${bid.days_needed} يوم`} />
            <InfoRow label="مدتك المقترحة" value={`${effectiveDays} يوم`} />
            <InfoRow
              label="جولة التفاوض"
              value={`${nextRound} من 3`}
              bordered={false}
            />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {saveError}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              disabled={isMaxRound || saving}
              onClick={handleSubmit}
            >
              {saving ? "جاري الإرسال..." : "إرسال العرض المضاد"}
            </Button>
            <Button variant="primary-outline" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
          </div>

          {isMaxRound && (
            <p className="text-sm text-red-500">
              لا يمكن إرسال عرض مضاد — تم استنفاد الجولات الثلاث.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCounterOfferPage;
