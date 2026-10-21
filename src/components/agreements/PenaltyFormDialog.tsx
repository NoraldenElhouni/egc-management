import { useState } from "react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { SearchableSelectField } from "../ui/inputs/SearchableSelectField";
import { useContractorsQuery } from "../../hooks/useContractors";
import { agreementErrorMessage, useCreatePenalty } from "../../hooks/agreements/useAgreements";
import { parseAmount } from "./AgreementFormDialog";

// Contractor, amount, reason. It waits for approval in the payments
// queue; once approved it comes off the contractor's next payment in
// this project automatically.

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

type Props = { projectId: string; isOpen: boolean; onClose: () => void };

export default function PenaltyFormDialog(props: Props) {
  if (!props.isOpen) return null;
  return <PenaltyFormDialogBody {...props} />;
}

function PenaltyFormDialogBody({ projectId, isOpen, onClose }: Props) {
  const { data: contractors = [], isLoading } = useContractorsQuery();
  const create = useCreatePenalty(projectId);
  const [contractorId, setContractorId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const value = parseAmount(amount);
  const missing = !contractorId
    ? "اختر المقاول"
    : value <= 0
      ? "اكتب مبلغ الغرامة"
      : !reason.trim()
        ? "اكتب سبب الغرامة"
        : null;

  const handleSave = () => {
    if (missing || create.isPending) return;
    setError(null);
    create.mutate(
      { contractorId, amount: value, reason },
      { onSuccess: onClose, onError: (err) => setError(agreementErrorMessage(err)) },
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div dir="rtl" className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">غرامة جديدة</h2>
          <p className="text-sm text-gray-500 mt-1">
            بعد اعتمادها تُخصم تلقائياً من أول دفعة للمقاول في هذا المشروع.
          </p>
        </div>

        <SearchableSelectField
          id="penalty-contractor"
          label="المقاول *"
          placeholder="ابحث واختر المقاول"
          loading={isLoading}
          options={contractors
            .filter((c) => c.status === "active")
            .map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name ?? ""}`.trim() }))}
          value={contractorId}
          onChange={setContractorId}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">مبلغ الغرامة *</label>
          <input
            className={`${inputClass} text-lg font-semibold`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">السبب *</label>
          <textarea
            className={inputClass}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: تأخير في التسليم"
          />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{missing ?? ""}</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" variant="error" onClick={handleSave} disabled={!!missing} loading={create.isPending}>
              حفظ الغرامة
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
