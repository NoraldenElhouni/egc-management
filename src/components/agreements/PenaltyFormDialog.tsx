import { useEffect, useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { SearchableSelectField } from "../ui/inputs/SearchableSelectField";
import { useContractorsQuery } from "../../hooks/useContractors";
import { agreementErrorMessage, useCreatePenalty } from "../../hooks/agreements/useAgreements";
import { lengthError } from "../../utils/agreements/rules";
import { parseAmount } from "./AgreementFormDialog";
import LimitedField, { inputClass } from "./LimitedField";

// Contractor, amount, reason, optional photos. It waits for approval in
// the payments queue; once approved it comes off the contractor's next
// payment in this project automatically. Opened from an agreement, the
// contractor is fixed.

const MAX_PHOTOS = 6;

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Opened from an agreement: this contractor, not changeable. */
  presetContractor?: { id: string; name: string | null } | null;
};

export default function PenaltyFormDialog(props: Props) {
  if (!props.isOpen) return null;
  return <PenaltyFormDialogBody {...props} />;
}

function PenaltyFormDialogBody({ projectId, isOpen, onClose, presetContractor }: Props) {
  const { data: contractors = [], isLoading } = useContractorsQuery();
  const create = useCreatePenalty(projectId);
  const [contractorId, setContractorId] = useState(presetContractor?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Object URLs for the thumbnails, released when the list changes.
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const value = parseAmount(amount);
  const missing = !contractorId
    ? "اختر المقاول"
    : value <= 0
      ? "اكتب مبلغ الغرامة"
      : lengthError(reason, "penaltyReason");

  const handleSave = () => {
    if (missing || create.isPending) return;
    setError(null);
    create.mutate(
      { contractorId, amount: value, reason, photos },
      {
        onSuccess: ({ failedPhotos }) => {
          if (failedPhotos > 0) window.alert(`تم تسجيل الغرامة، لكن تعذر رفع ${failedPhotos} من الصور`);
          onClose();
        },
        onError: (err) => setError(agreementErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div dir="rtl" className="space-y-5 max-h-[78vh] overflow-y-auto px-1">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">غرامة جديدة</h2>
          <p className="text-sm text-gray-500 mt-1">
            بعد اعتمادها تُخصم تلقائياً من أول دفعة للمقاول في هذا المشروع.
          </p>
        </div>

        {presetContractor ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">المقاول</label>
            <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm font-medium">{presetContractor.name ?? "—"}</div>
          </div>
        ) : (
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
        )}
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
        <LimitedField
          limit="penaltyReason"
          label="سبب الغرامة"
          rows={3}
          value={reason}
          onChange={setReason}
          placeholder="مثال: تأخير في تسليم أعمال الدور الأول أسبوعين"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">صور (اختياري)</label>
          <div className="flex flex-wrap gap-2">
            {previews.map((url, i) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border" />
                <button
                  type="button"
                  title="إزالة"
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                  className="absolute top-1 left-1 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-blue-300 text-xs text-blue-700 hover:bg-blue-50">
                <ImagePlus className="w-5 h-5" />
                إضافة
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setPhotos((ps) => [...ps, ...picked].slice(0, MAX_PHOTOS));
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
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
