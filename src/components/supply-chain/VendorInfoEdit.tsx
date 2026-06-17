// src/components/vendor/VendorInfoEdit.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Vendor } from "../../types/global.type";

const vendorFormSchema = z.object({
  vendor_name: z.string().min(1, "اسم المورد مطلوب"),
  contact_name: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^\S+@\S+\.\S+$/.test(val), {
      message: "بريد إلكتروني غير صالح",
    }),
  phone_number: z.string().optional(),
  alt_phone_number: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface VendorInfoEditProps {
  vendor: Vendor;
  saving?: boolean;
  onSave: (values: VendorFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";
const labelClass = "mb-1 block text-xs text-gray-500";

const VendorInfoEdit = ({
  vendor,
  saving,
  onSave,
  onCancel,
}: VendorInfoEditProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendor_name: vendor.vendor_name ?? "",
      contact_name: vendor.contact_name ?? "",
      email: vendor.email ?? "",
      phone_number: vendor.phone_number ?? "",
      alt_phone_number: vendor.alt_phone_number ?? "",
      country: vendor.country ?? "",
      city: vendor.city ?? "",
      address: vendor.address ?? "",
    },
  });

  return (
    <div dir="rtl" className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-4 text-lg font-semibold">تعديل بيانات المورد</h2>

      <form
        onSubmit={handleSubmit(onSave)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <label className={labelClass}>اسم المورد</label>
          <input className={inputClass} {...register("vendor_name")} />
          {errors.vendor_name && (
            <p className="mt-1 text-xs text-red-500">
              {errors.vendor_name.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>الشخص المسؤول</label>
          <input className={inputClass} {...register("contact_name")} />
        </div>

        <div>
          <label className={labelClass}>البريد الإلكتروني</label>
          <input type="email" className={inputClass} {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>رقم الهاتف</label>
          <input className={inputClass} {...register("phone_number")} />
        </div>

        <div>
          <label className={labelClass}>رقم هاتف بديل</label>
          <input className={inputClass} {...register("alt_phone_number")} />
        </div>

        <div>
          <label className={labelClass}>الدولة</label>
          <input className={inputClass} {...register("country")} />
        </div>

        <div>
          <label className={labelClass}>المدينة</label>
          <input className={inputClass} {...register("city")} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>العنوان</label>
          <textarea rows={3} className={inputClass} {...register("address")} />
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorInfoEdit;
