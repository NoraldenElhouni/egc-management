import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Vendor } from "../../../types/global.type";
import Button from "../../ui/Button";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { useBanks } from "../../../hooks/useBanks";
import { useAuth } from "../../../hooks/useAuth";

interface EditVendorBankInfoDialogProps {
  open: boolean;
  vendor: Vendor;
  onClose: () => void;
  onSuccess: () => void;
}

const EditVendorBankInfoDialog = ({
  open,
  vendor,
  onClose,
  onSuccess,
}: EditVendorBankInfoDialogProps) => {
  const [bankId, setBankId] = useState(vendor.bank_id ?? "");
  const [bankNumber, setBankNumber] = useState(vendor.bank_number ?? "");
  const [bankHolderName, setBankHolderName] = useState(
    vendor.bank_holder_name ?? "",
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { banks, loading: banksLoading } = useBanks();
  const bankOptions = useMemo(
    () => banks.map((b) => ({ value: b.id, label: b.name })),
    [banks],
  );

  useEffect(() => {
    if (!open) return;
    setBankId(vendor.bank_id ?? "");
    setBankNumber(vendor.bank_number ?? "");
    setBankHolderName(vendor.bank_holder_name ?? "");
    setError(null);
    setShowSaveConfirm(false);
  }, [open, vendor]);

  if (!open) return null;

  function handleRequestSave() {
    if (!bankId) {
      setError("يرجى اختيار البنك");
      return;
    }
    setError(null);
    setShowSaveConfirm(true);
  }

  async function handleConfirmSave() {
    const selectedBank = banks.find((b) => b.id === bankId);
    if (!selectedBank) {
      setError("البنك المختار غير صالح");
      setShowSaveConfirm(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          bank_id: selectedBank.id,
          bank_name: selectedBank.name,
          bank_number: bankNumber.trim() || null,
          bank_holder_name: bankHolderName.trim() || null,
          bank_account_approved: true,
          bank_approved_by: user?.id ?? null,
          bank_approved_at: new Date().toISOString(),
        })
        .eq("id", vendor.id);

      if (updateError) throw updateError;

      setShowSaveConfirm(false);
      onSuccess();
    } catch (err) {
      console.error("Error updating vendor bank info:", err);
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
            <SearchableSelectField
              id="bankId"
              label="اسم البنك"
              placeholder="-- ابحث واختر بنكاً --"
              options={bankOptions}
              loading={banksLoading}
              value={bankId}
              onChange={(val) => setBankId(val)}
            />
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
              onClick={handleRequestSave}
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

export default EditVendorBankInfoDialog;
