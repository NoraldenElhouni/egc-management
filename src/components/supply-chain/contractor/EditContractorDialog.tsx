import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { contractorWithSpecializations } from "../../../types/extended.type";
import { useSpecializations } from "../../../hooks/useSpecializations";
import Button from "../../ui/Button";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { Search, X } from "lucide-react";

interface EditContractorDialogProps {
  open: boolean;
  contractor: contractorWithSpecializations;
  onClose: () => void;
  onSuccess: () => void;
}

const EditContractorDialog = ({
  open,
  contractor,
  onClose,
  onSuccess,
}: EditContractorDialogProps) => {
  const { data: specializations, loading: specializationsLoading } =
    useSpecializations("Contractor");

  const [firstName, setFirstName] = useState(contractor.first_name);
  const [lastName, setLastName] = useState(contractor.last_name ?? "");
  const [email, setEmail] = useState(contractor.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(contractor.phone_number ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    contractor.whatsapp_number ?? "",
  );
  const [mainSpecializationId, setMainSpecializationId] = useState(
    contractor.specialization_id ?? "",
  );
  const [additionalSpecializationIds, setAdditionalSpecializationIds] =
    useState<string[]>([]);
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName(contractor.first_name);
    setLastName(contractor.last_name ?? "");
    setEmail(contractor.email ?? "");
    setPhoneNumber(contractor.phone_number ?? "");
    setWhatsappNumber(contractor.whatsapp_number ?? "");
    setMainSpecializationId(contractor.specialization_id ?? "");
    setAdditionalSpecializationIds(
      (contractor.users?.user_specializations ?? []).map(
        (us) => us.specialization_id,
      ),
    );
    setSpecializationSearch("");
    setError(null);
  }, [open, contractor]);

  const filteredSpecializations = useMemo(() => {
    const trimmed = specializationSearch.trim().toLowerCase();
    if (!trimmed) return specializations;
    return specializations.filter((s) =>
      s.name.toLowerCase().includes(trimmed),
    );
  }, [specializations, specializationSearch]);

  const selectedAdditionalSpecializations = useMemo(
    () =>
      additionalSpecializationIds
        .map((id) => specializations.find((s) => s.id === id))
        .filter((s): s is (typeof specializations)[number] => Boolean(s)),
    [additionalSpecializationIds, specializations],
  );

  if (!open) return null;

  function toggleAdditional(id: string) {
    setAdditionalSpecializationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

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
          specialization_id: mainSpecializationId || null,
        })
        .eq("id", contractor.id);

      if (updateError) throw updateError;

      if (contractor.user_id) {
        const { error: deleteError } = await supabase
          .from("user_specializations")
          .delete()
          .eq("user_id", contractor.user_id);

        if (deleteError) throw deleteError;

        if (additionalSpecializationIds.length > 0) {
          const { error: insertError } = await supabase
            .from("user_specializations")
            .insert(
              additionalSpecializationIds.map((specialization_id) => ({
                user_id: contractor.user_id as string,
                specialization_id,
              })),
            );

          if (insertError) throw insertError;
        }
      }

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
              disabled={contractor.user_id !== null}
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

        <SearchableSelectField
          id="mainSpecializationId"
          label="التخصص الرئيسي"
          placeholder="-- ابحث واختر تخصصاً --"
          options={specializations.map((s) => ({
            value: s.id,
            label: s.name,
          }))}
          loading={specializationsLoading}
          value={mainSpecializationId}
          onChange={(val) => setMainSpecializationId(val)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-gray-700">تخصصات إضافية</label>

          {!contractor.user_id ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              يجب أن يكون للمقاول حساب مستخدم لإضافة أكثر من تخصص.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedAdditionalSpecializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdditionalSpecializations.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 pr-1 pl-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => toggleAdditional(s.id)}
                        className="hover:text-blue-900"
                        aria-label={`إزالة ${s.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="relative border-b border-gray-200">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={specializationSearch}
                    onChange={(e) => setSpecializationSearch(e.target.value)}
                    placeholder="ابحث في التخصصات..."
                    className="w-full pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={specializationsLoading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 max-h-48 overflow-y-auto">
                  {specializationsLoading ? (
                    <p className="text-xs text-gray-500 col-span-full text-center py-2">
                      جاري تحميل التخصصات...
                    </p>
                  ) : filteredSpecializations.length === 0 ? (
                    <p className="text-xs text-gray-500 col-span-full text-center py-2">
                      لا توجد نتائج
                    </p>
                  ) : (
                    filteredSpecializations.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={additionalSpecializationIds.includes(s.id)}
                          onChange={() => toggleAdditional(s.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span>{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
