import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Contractors } from "../../../types/global.type";
import Button from "../../ui/Button";

interface EditContractorDialogProps {
  open: boolean;
  contractor: Contractors;
  onClose: () => void;
  onSuccess: () => void;
}

const EditContractorDialog = ({
  open,
  contractor,
  onClose,
  onSuccess,
}: EditContractorDialogProps) => {
  const [firstName, setFirstName] = useState(contractor.first_name);
  const [lastName, setLastName] = useState(contractor.last_name ?? "");
  const [email, setEmail] = useState(contractor.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(contractor.phone_number ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    contractor.whatsapp_number ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName(contractor.first_name);
    setLastName(contractor.last_name ?? "");
    setEmail(contractor.email ?? "");
    setPhoneNumber(contractor.phone_number ?? "");
    setWhatsappNumber(contractor.whatsapp_number ?? "");
    setError(null);
  }, [open, contractor]);

  if (!open) return null;

  async function handleSave() {
    if (!firstName.trim()) {
      setError("الاسم الأول مطلوب");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("contractors")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          email: email.trim() || null,
          phone_number: phoneNumber.trim() || null,
          whatsapp_number: whatsappNumber.trim() || null,
        })
        .eq("id", contractor.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error("Error updating contractor:", err);
      setError("فشل تحديث بيانات المقاول. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">
          تعديل بيانات المقاول
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              الاسم الأول
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              الاسم الأخير
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              رقم الهاتف
            </label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              رقم الواتساب
            </label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
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
            onClick={handleSave}
            loading={saving}
          >
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditContractorDialog;
