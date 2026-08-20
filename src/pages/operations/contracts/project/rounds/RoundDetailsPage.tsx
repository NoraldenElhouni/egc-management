import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Ban, Pencil, Plus, Send } from "lucide-react";
import Button from "../../../../../components/ui/Button";
import Badge from "../../../../../components/ui/Badge";
import Separator from "../../../../../components/ui/separator";
import GenericTable from "../../../../../components/tables/table";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../components/ui/errorPage";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import AttachmentsPreview, {
  Attachment,
} from "../../../../../components/ui/AttachmentsPreview";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import {
  useRound,
  useSendRoundToPricing,
  useCancelRound,
} from "../../../../../hooks/operations/contracts/rounds/useRounds";
import {
  useQuotesByRound,
  QuoteRow,
} from "../../../../../hooks/operations/contracts/rounds/useQuotes";
import { roundItemsColumns } from "../../../../../components/tables/columns/operations/contracts/roundItemsColumns";
import { getQuotesColumns } from "../../../../../components/tables/columns/operations/contracts/quotesColumns";
import AwardQuoteDialog from "../../../../../components/dialog/AwardQuoteDialog";
import { supabase } from "../../../../../lib/supabaseClient";

const roundStatusLabel: Record<string, string> = {
  draft: "مسودة",
  pricing: "قيد التسعير",
  awarded: "تم الترسية",
  cancelled: "ملغى",
};

const roundStatusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pricing: "bg-yellow-100 text-yellow-700",
  awarded: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

function useRoundAttachments(roundId: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  useEffect(() => {
    if (!roundId) return;
    supabase
      .from("attachments")
      .select("*")
      .eq("entity_type", "round")
      .eq("entity_id", roundId)
      .then(({ data }) => setAttachments((data ?? []) as Attachment[]));
  }, [roundId]);
  return attachments;
}

const RoundDetailsPage = () => {
  const { projectId, roundId } = useParams<{
    projectId: string;
    roundId: string;
  }>();
  const navigate = useNavigate();

  const { round, loading, error, refetch } = useRound(roundId ?? "");
  const {
    quotes,
    loading: quotesLoading,
    refetch: refetchQuotes,
  } = useQuotesByRound(roundId ?? "");
  const { sendToPricing, loading: sendingToPricing } = useSendRoundToPricing();
  const { cancelRound, loading: cancelling } = useCancelRound();
  const attachments = useRoundAttachments(roundId ?? "");

  const [confirmAction, setConfirmAction] = useState<
    "pricing" | "cancel" | null
  >(null);
  const [awardingQuote, setAwardingQuote] = useState<QuoteRow | null>(null);

  if (!roundId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل تفاصيل الجولة..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل الجولة" error={error.message} />
    );
  if (!round) return null;

  const handleConfirmAction = async () => {
    if (confirmAction === "pricing") {
      const { error } = await sendToPricing(round.id);
      if (error) {
        alert("حدث خطأ أثناء إرسال الجولة للتسعير");
        setConfirmAction(null);
        return;
      }
    } else if (confirmAction === "cancel") {
      const { error } = await cancelRound(round.id);
      if (error) {
        alert("حدث خطأ أثناء إلغاء الجولة");
        setConfirmAction(null);
        return;
      }
    }
    setConfirmAction(null);
    refetch();
  };

  const isRoundAwarded = round.status === "awarded";
  const quotesColumns = getQuotesColumns(
    (quote) => setAwardingQuote(quote),
    isRoundAwarded,
  );

  const extrasByQuote = quotes
    .map((q) => ({
      quote: q,
      extras: q.quote_items.filter((i) => i.round_item_id === null),
    }))
    .filter((g) => g.extras.length > 0);

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{round.title}</h1>
          <h4 className="text-sm text-gray-500 mt-1">تفاصيل جولة التسعير</h4>
        </div>
        <div className="flex items-center gap-3">
          {round.status === "draft" && (
            <>
              <Button
                size="sm"
                disabled={sendingToPricing}
                onClick={() => setConfirmAction("pricing")}
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال للتسعير
              </Button>
              <Link to="edit">
                <Button size="sm" variant="primary-outline">
                  <Pencil className="w-4 h-4 ml-2" />
                  تعديل الجولة
                </Button>
              </Link>
            </>
          )}
          {round.status === "pricing" && (
            <Link to="quotes/new">
              <Button size="sm" variant="info">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عرض سعر
              </Button>
            </Link>
          )}
          {(round.status === "draft" || round.status === "pricing") && (
            <Button
              size="sm"
              variant="error"
              disabled={cancelling}
              onClick={() => setConfirmAction("cancel")}
            >
              <Ban className="w-4 h-4 ml-2" />
              إلغاء الجولة
            </Button>
          )}
        </div>
      </div>

      {/* status + info */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${roundStatusColor[round.status]}`}
          >
            {roundStatusLabel[round.status]}
          </span>
          {round.specialization && (
            <Badge label={round.specialization.name} variant="purple" />
          )}
          <Badge label={`${round.round_items.length} بند`} />
          <Badge label={`${quotes.length} عرض`} />
          <Badge label={formatDate(round.created_at)} />
        </div>
      </div>

      {round.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-2">ملاحظات</h2>
          <Separator />
          <p className="text-sm leading-7 text-gray-700">{round.notes}</p>
        </div>
      )}

      {/* items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">بنود الجولة</h2>
        <Separator />
        <GenericTable
          data={round.round_items}
          columns={roundItemsColumns}
          enableSorting
        />
      </div>

      {/* quotes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">عروض الأسعار</h2>
        <Separator />
        {quotesLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            جاري تحميل العروض...
          </p>
        ) : (
          <GenericTable
            data={quotes}
            columns={quotesColumns}
            enableSorting
            emptyMessage="لم يتم تقديم أي عروض بعد"
          />
        )}
      </div>

      {/* compare */}
      {quotes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">مقارنة العروض</h2>
          <Separator />
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse table-auto text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-right font-semibold border-b">
                    البند
                  </th>
                  <th className="py-2 px-3 text-right font-semibold border-b">
                    الوحدة
                  </th>
                  <th className="py-2 px-3 text-right font-semibold border-b">
                    الكمية
                  </th>
                  {quotes.map((q) => (
                    <th
                      key={q.id}
                      className="py-2 px-3 text-right font-semibold border-b whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {q.contractor?.first_name}{" "}
                          {q.contractor?.last_name ?? ""}
                        </span>
                        {!isRoundAwarded && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => setAwardingQuote(q)}
                          >
                            ترسية
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {round.round_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 border-b">{item.name}</td>
                    <td className="py-2 px-3 border-b text-gray-500">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 border-b text-gray-500">
                      {item.quantity}
                    </td>
                    {quotes.map((q) => {
                      const qi = q.quote_items.find(
                        (x) => x.round_item_id === item.id,
                      );
                      return (
                        <td key={q.id} className="py-2 px-3 border-b">
                          {qi ? (
                            <div>
                              <p>{formatCurrency(qi.unit_price)}</p>
                              <p className="text-xs text-gray-400">
                                {formatCurrency(qi.unit_price * item.quantity)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-2 px-3" colSpan={3}>
                    الإجمالي
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} className="py-2 px-3">
                      {formatCurrency(q.total)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {extrasByQuote.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-semibold text-gray-500">
                بنود إضافية من المقاولين
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extrasByQuote.map(({ quote, extras }) => (
                  <div key={quote.id} className="border rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      {quote.contractor?.first_name}{" "}
                      {quote.contractor?.last_name ?? ""}
                    </p>
                    <div className="space-y-2">
                      {extras.map((e) => (
                        <div
                          key={e.id}
                          className="flex justify-between text-sm border-b last:border-0 pb-1.5"
                        >
                          <span className="text-gray-700">
                            {e.name}{" "}
                            <span className="text-gray-400">
                              ({e.quantity} {e.unit})
                            </span>
                          </span>
                          <span className="font-medium">
                            {formatCurrency(e.unit_price * e.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* attachments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">المرفقات</h2>
        <Separator />
        <AttachmentsPreview attachments={attachments} />
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmAction === "pricing" ? "إرسال الجولة للتسعير" : "إلغاء الجولة"
        }
        message={
          confirmAction === "pricing"
            ? "ستُفتح الجولة لإدخال عروض أسعار المقاولين."
            : "هل أنت متأكد من إلغاء هذه الجولة؟ لا يمكن التراجع عن هذا الإجراء."
        }
        confirmLabel={
          confirmAction === "pricing" ? "نعم، أرسل للتسعير" : "نعم، ألغِ الجولة"
        }
        confirmVariant={confirmAction === "pricing" ? "success" : "error"}
        loading={sendingToPricing || cancelling}
      />

      {awardingQuote && (
        <AwardQuoteDialog
          quote={awardingQuote}
          onClose={() => setAwardingQuote(null)}
          onSuccess={(contractId) => {
            setAwardingQuote(null);
            refetchQuotes();
            navigate(`/operations/contracts/project/${projectId}/${contractId}`);
          }}
        />
      )}
    </div>
  );
};

export default RoundDetailsPage;
