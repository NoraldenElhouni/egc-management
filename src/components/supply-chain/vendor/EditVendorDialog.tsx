import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Vendor } from "../../../types/global.type";
import Button from "../../ui/Button";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { useSpecializations } from "../../../hooks/useSpecializations";

interface EditVendorDialogProps {
  open: boolean;
  vendor: Vendor;
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
  const [specializationId, setSpecializationId] = useState(
    vendor.specialization_id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSpecializationId(vendor.specialization_id ?? "");
    setError(null);
  }, [open, vendor]);

  if (!open) return null;

  async function handleSave() {
    if (!vendorName.trim()) {
      setError("اسم المورد مطلوب");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("بريد إلكتروني غير صالح");
      return;
    }

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
          specialization_id: specializationId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendor.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error("Error updating vendor:", err);
      setError("فشل تحديث بيانات المورد. حاول مرة أخرى.");
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
            <label className="text-xs font-medium text-gray-500">
              الدولة
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              المدينة
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">
              العنوان
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="sm:col-span-2">
            <SearchableSelectField
              id="specializationId"
              label="التخصص"
              placeholder="-- ابحث واختر تخصصاً --"
              options={specializations.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              loading={specializationsLoading}
              value={specializationId}
              onChange={(val) => setSpecializationId(val)}
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

export default EditVendorDialog;
