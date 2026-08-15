import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Contractors } from "../../../types/global.type";
import Button from "../../ui/Button";
import ConfirmDialog from "../../ui/ConfirmDialog";

interface EditContractorBankInfoDialogProps {
  open: boolean;
  contractor: Contractors;
  onClose: () => void;
  onSuccess: () => void;
}

const EditContractorBankInfoDialog = ({
  open,
  contractor,
  onClose,
  onSuccess,
}: EditContractorBankInfoDialogProps) => {
  const [bankName, setBankName] = useState(contractor.bank_name ?? "");
  const [bankNumber, setBankNumber] = useState(contractor.bank_number ?? "");
  const [bankHolderName, setBankHolderName] = useState(
    contractor.bank_holder_name ?? "",
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBankName(contractor.bank_name ?? "");
    setBankNumber(contractor.bank_number ?? "");
    setBankHolderName(contractor.bank_holder_name ?? "");
    setError(null);
    setShowSaveConfirm(false);
  }, [open, contractor]);

  if (!open) return null;

  async function handleConfirmSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("contractors")
        .update({
          bank_name: bankName.trim() || null,
          bank_number: bankNumber.trim() || null,
          bank_holder_name: bankHolderName.trim() || null,
          bank_account_aproved: true,
        })
        .eq("id", contractor.id);

      if (updateError) throw updateError;

      setShowSaveConfirm(false);
      onSuccess();
    } catch (err) {
      console.error("Error updating contractor bank info:", err);
      setError("فشل تحديث معلومات البنك. حاول مرة أخرى.");
      setShowSaveConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900">
            تعديل معلومات البنك
          </h2>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                اسم البنك
              </label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                رقم الحساب
              </label>
              <input
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                اسم صاحب الحساب
              </label>
              <input
                value={bankHolderName}
                onChange={(e) => setBankHolderName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="muted"
              size="md"
              onClick={onClose}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setShowSaveConfirm(true)}
              disabled={saving}
            >
              حفظ
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSaveConfirm}
        title="تأكيد حفظ معلومات البنك"
        message="سيتم اعتماد معلومات البنك (اعتماد الحساب) عند الحفظ. هل تريد المتابعة؟"
        confirmLabel="حفظ واعتماد"
        cancelLabel="إلغاء"
        confirmVariant="success"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </>
  );
};

export default EditContractorBankInfoDialog;
