import { Mail, Phone, MapPin, User, Pencil } from "lucide-react";
import { Vendor } from "../../types/global.type";

interface VendorInfoViewProps {
  vendor: Vendor;
  onEdit: () => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  </div>
);

const VendorInfoView = ({ vendor, onEdit }: VendorInfoViewProps) => {
  return (
    <div dir="rtl" className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{vendor.vendor_name}</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          تعديل
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <InfoRow
          icon={User}
          label="الشخص المسؤول"
          value={vendor.contact_name}
        />
        {/* <InfoRow icon={Building2} label="التخصص" value={vendor.} /> */}
        <InfoRow icon={Mail} label="البريد الإلكتروني" value={vendor.email} />
        <InfoRow icon={Phone} label="رقم الهاتف" value={vendor.phone_number} />
        <InfoRow
          icon={Phone}
          label="رقم هاتف بديل"
          value={vendor.alt_phone_number}
        />
        <InfoRow icon={MapPin} label="الدولة" value={vendor.country} />
        <InfoRow icon={MapPin} label="المدينة" value={vendor.city} />
        <InfoRow icon={MapPin} label="العنوان" value={vendor.address} />
      </div>
    </div>
  );
};

export default VendorInfoView;
