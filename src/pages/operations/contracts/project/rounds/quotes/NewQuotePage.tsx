import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRound } from "../../../../../../hooks/operations/contracts/rounds/useRounds";
import { useContractors } from "../../../../../../hooks/operations/contracts/useContracts";
import {
  useCreateQuote,
  QuoteItemInput,
} from "../../../../../../hooks/operations/contracts/rounds/useQuotes";
import { SearchableSelectField } from "../../../../../../components/ui/inputs/SearchableSelectField";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import Separator from "../../../../../../components/ui/separator";
import QuotePriceEntryForm from "../../../../../../components/operations/contracts/round/QuotePriceEntryForm";

const NewQuotePage = () => {
  const { projectId, roundId } = useParams<{
    projectId: string;
    roundId: string;
  }>();
  const navigate = useNavigate();
  const { round, loading, error } = useRound(roundId ?? "");
  const { contractors, loading: contractorsLoading } = useContractors(true);
  const { createQuote, loading: saving } = useCreateQuote();
  const [contractorId, setContractorId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!roundId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات الجولة..." />;
  if (error) return <ErrorPage label="حدث خطأ" error={error.message} />;
  if (!round) return null;

  const filteredContractors = round.specialization_id
    ? contractors.filter((c) =>
        c.users?.user_specializations?.some(
          (s) => s.specialization_id === round.specialization_id,
        ),
      )
    : contractors;

  const contractorOptions = filteredContractors.map((c) => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name ?? ""}`.trim(),
  }));

  const handleSubmit = async (input: {
    items: QuoteItemInput[];
    days_needed: number | null;
    notes: string | null;
  }) => {
    if (!contractorId) {
      setSubmitError("يرجى اختيار المقاول أولاً");
      return;
    }
    const { error, quoteId } = await createQuote({
      round_id: roundId,
      contractor_id: contractorId,
      days_needed: input.days_needed,
      notes: input.notes,
      items: input.items,
    });
    if (error || !quoteId) {
      setSubmitError("حدث خطأ أثناء حفظ العرض: " + error?.message);
      return;
    }
    navigate(
      `/operations/contracts/project/${projectId}/rounds/${roundId}/quotes/${quoteId}`,
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-1">عرض سعر جديد</h1>
      <p className="text-sm text-gray-500 mb-6">{round.title}</p>

      <div className="mb-4">
        <SearchableSelectField
          id="contractor_id"
          label="المقاول"
          options={contractorOptions}
          loading={contractorsLoading}
          value={contractorId}
          onChange={setContractorId}
          placeholder="-- اختر المقاول --"
        />
      </div>

      <Separator />

      {submitError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {submitError}
        </p>
      )}

      <QuotePriceEntryForm
        roundItems={round.round_items}
        submitLabel="حفظ العرض"
        loading={saving}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
};

export default NewQuotePage;
