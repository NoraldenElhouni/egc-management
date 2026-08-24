import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { VendorWithBankApprover } from "../../../types/extended.type";
import Button from "../../ui/Button";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { useSpecializations } from "../../../hooks/useSpecializations";
import { translateStatus } from "../../../utils/translations";
import { Search, X } from "lucide-react";

const VENDOR_STATUS_OPTIONS = ["active", "inactive", "blocked"] as const;
type VendorStatus = (typeof VENDOR_STATUS_OPTIONS)[number];

interface EditVendorDialogProps {
  open: boolean;
  vendor: VendorWithBankApprover;
  onClose: () => void;
  onSuccess: () => void;
}

const EditVendorDialog = ({
  open,
  vendor,
  onClose,
  onSuccess,
}: EditVendorDialogProps) => {
  const [vendorName, setVendorName] = useState(vendor.vendor_name);
  const [contactName, setContactName] = useState(vendor.contact_name ?? "");
  const [email, setEmail] = useState(vendor.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(vendor.phone_number ?? "");
  const [altPhoneNumber, setAltPhoneNumber] = useState(
    vendor.alt_phone_number ?? "",
  );
  const [country, setCountry] = useState(vendor.country ?? "");
  const [city, setCity] = useState(vendor.city ?? "");
  const [address, setAddress] = useState(vendor.address ?? "");
  const [mainSpecializationId, setMainSpecializationId] = useState(
    vendor.specialization_id ?? "",
  );
  const [additionalSpecializationIds, setAdditionalSpecializationIds] =
    useState<string[]>([]);
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [status, setStatus] = useState<VendorStatus>(
    (vendor.status as VendorStatus) ?? "active",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const { data: specializations, loading: specializationsLoading } =
    useSpecializations("Vendor");

  useEffect(() => {
    if (!open) return;
    setVendorName(vendor.vendor_name);
    setContactName(vendor.contact_name ?? "");
    setEmail(vendor.email ?? "");
    setPhoneNumber(vendor.phone_number ?? "");
    setAltPhoneNumber(vendor.alt_phone_number ?? "");
    setCountry(vendor.country ?? "");
    setCity(vendor.city ?? "");
    setAddress(vendor.address ?? "");
    setMainSpecializationId(vendor.specialization_id ?? "");
    setAdditionalSpecializationIds(
      (vendor.users?.user_specializations ?? []).map(
        (us) => us.specialization_id,
      ),
    );
    setSpecializationSearch("");
    setStatus((vendor.status as VendorStatus) ?? "active");
    setError(null);
    setShowStatusConfirm(false);
  }, [open, vendor]);

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

  function handleSave() {
    if (!vendorName.trim()) {
      setError("اسم المورد مطلوب");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("بريد إلكتروني غير صالح");
      return;
    }
    setError(null);

    if (status !== (vendor.status ?? "active")) {
      setShowStatusConfirm(true);
      return;
    }

    performSave();
  }

  async function performSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          vendor_name: vendorName.trim(),
          contact_name: contactName.trim() || null,
          email: email.trim() || null,
          phone_number: phoneNumber.trim() || null,
          alt_phone_number: altPhoneNumber.trim() || null,
          country: country.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          specialization_id: mainSpecializationId || null,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendor.id);

      if (updateError) throw updateError;

      if (vendor.user_id) {
        const { error: deleteError } = await supabase
          .from("user_specializations")
          .delete()
          .eq("user_id", vendor.user_id);

        if (deleteError) throw deleteError;

        if (additionalSpecializationIds.length > 0) {
          const { error: insertError } = await supabase
            .from("user_specializations")
            .insert(
              additionalSpecializationIds.map((specialization_id) => ({
                user_id: vendor.user_id as string,
                specialization_id,
              })),
            );

          if (insertError) throw insertError;
        }
      }

      onSuccess();
    } catch (err) {
      console.error("Error updating vendor:", err);
      setError("فشل تحديث بيانات المورد. حاول مرة أخرى.");
      setShowStatusConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">
          تعديل بيانات المورد
        </h2>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-gray-500">الحالة</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VendorStatus)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            {VENDOR_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {translateStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">
              اسم المورد
            </label>
            <input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">
              الشخص المسؤول
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
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
              رقم هاتف بديل
            </label>
            <input
              value={altPhoneNumber}
              onChange={(e) => setAltPhoneNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">الدولة</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">المدينة</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">العنوان</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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

          {!vendor.user_id ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              يجب أن يكون للمورد حساب مستخدم لإضافة أكثر من تخصص.
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

      <ConfirmDialog
        open={showStatusConfirm}
        title="تأكيد تغيير حالة المورد"
        message={`سيتم تغيير حالة المورد من "${translateStatus(vendor.status ?? "active")}" إلى "${translateStatus(status)}". هل أنت متأكد؟`}
        confirmLabel="تأكيد وحفظ"
        cancelLabel="إلغاء"
        confirmVariant="warning"
        loading={saving}
        onConfirm={performSave}
        onCancel={() => setShowStatusConfirm(false)}
      />
    </div>
  );
};

export default EditVendorDialog;
