import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award as AwardIcon } from "lucide-react";
import {
  useQuote,
  useUpdateQuote,
  QuoteItemInput,
} from "../../../../../../hooks/operations/contracts/rounds/useQuotes";
import { useRound } from "../../../../../../hooks/operations/contracts/rounds/useRounds";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import GenericTable from "../../../../../../components/tables/table";
import Button from "../../../../../../components/ui/Button";
import { formatCurrency, formatDate } from "../../../../../../utils/helpper";
import QuotePriceEntryForm from "../../../../../../components/operations/contracts/round/QuotePriceEntryForm";
import { quoteItemsColumns } from "../../../../../../components/tables/columns/operations/contracts/quoteItemsColumns";
import AwardQuoteDialog from "../../../../../../components/dialog/AwardQuoteDialog";

const QuoteDetailPage = () => {
  const { projectId, roundId, quoteId } = useParams<{
    projectId: string;
    roundId: string;
    quoteId: string;
  }>();
  const navigate = useNavigate();
  const { quote, loading, error, refetch } = useQuote(quoteId ?? "");
  const { round } = useRound(roundId ?? "");
  const { updateQuote, loading: saving } = useUpdateQuote();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAward, setShowAward] = useState(false);

  if (!quoteId || !roundId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل تفاصيل العرض..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل العرض" error={error.message} />
    );
  if (!quote) return null;

  const canEdit = round?.status === "pricing";
  const contractorName = `${quote.contractor?.first_name ?? ""} ${
    quote.contractor?.last_name ?? ""
  }`.trim();

  const initialPrices = Object.fromEntries(
    quote.quote_items
      .filter((i) => i.round_item_id !== null)
      .map((i) => [i.round_item_id as string, i.unit_price]),
  );
  const initialExtras = quote.quote_items
    .filter((i) => i.round_item_id === null)
    .map((i) => ({
      name: i.name ?? "",
      unit: i.unit ?? "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      note: i.note,
    }));

  const handleSubmit = async (input: {
    items: QuoteItemInput[];
    days_needed: number | null;
    notes: string | null;
  }) => {
    const { error } = await updateQuote(quoteId, input);
    if (error) {
      setSubmitError("حدث خطأ أثناء حفظ التعديلات: " + error.message);
      return;
    }
    refetch();
    navigate(`/operations/contracts/project/${projectId}/rounds/${roundId}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل العرض</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {quote.round?.title ?? ""} · {contractorName}
          </h4>
        </div>
        {round?.status !== "awarded" && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowAward(true)}
          >
            <AwardIcon className="w-4 h-4 ml-2" />
            ترسية هذا العرض
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">بيانات المقاول</h2>
          <Separator />
          <InfoRow label="الاسم" value={contractorName || "—"} />
          <InfoRow
            label="الهاتف"
            value={quote.contractor?.phone_number ?? "—"}
            bordered={false}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">ملخص العرض</h2>
          <Separator />
          <InfoRow label="تاريخ التقديم" value={formatDate(quote.created_at)} />
          <InfoRow
            label="المدة المطلوبة"
            value={quote.days_needed != null ? `${quote.days_needed} يوم` : "—"}
          />
          <InfoRow
            label="الإجمالي"
            value={formatCurrency(quote.total)}
            bordered={false}
          />
        </div>
      </div>

      {quote.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-2">ملاحظات المقاول</h2>
          <Separator />
          <p className="text-sm leading-7 text-gray-700">{quote.notes}</p>
        </div>
      )}

      {submitError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">بنود العرض</h2>
        <Separator />
        {canEdit ? (
          <QuotePriceEntryForm
            roundItems={round?.round_items ?? []}
            initialPrices={initialPrices}
            initialExtras={initialExtras}
            initialDaysNeeded={quote.days_needed}
            initialNotes={quote.notes}
            submitLabel="حفظ التعديلات"
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
          />
        ) : (
          <GenericTable
            data={quote.quote_items}
            columns={quoteItemsColumns}
            enableSorting
          />
        )}
      </div>

      {showAward && (
        <AwardQuoteDialog
          quote={quote}
          onClose={() => setShowAward(false)}
          onSuccess={(contractId) => {
            setShowAward(false);
            navigate(`/operations/contracts/project/${projectId}/${contractId}`);
          }}
        />
      )}
    </div>
  );
};

export default QuoteDetailPage;
