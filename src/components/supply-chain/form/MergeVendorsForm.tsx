import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVendorsNoUser } from "../../../hooks/useVendors";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import Button from "../../ui/Button";
import { AssignUserToVendor } from "../../../services/vendors/setVendors";

const MergeVendorSchema = z.object({
  vendorId: z.string().min(1, "يجب اختيار المورد"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف"),
});

type MergeVendorFormValues = z.infer<typeof MergeVendorSchema>;

const MergeVendorsForm = () => {
  const { vendors, error, loading } = useVendorsNoUser();
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MergeVendorFormValues>({
    resolver: zodResolver(MergeVendorSchema),
    defaultValues: { vendorId: "", email: "", password: "" },
  });

  const vendorId = watch("vendorId");

  const vendorOptions = vendors.map((v) => ({
    value: v.id,
    label: `${v.vendor_name}${v.contact_name ? " — " + v.contact_name : ""}${v.phone_number ? " — " + v.phone_number : ""}`,
  }));

  const onSubmit = async (values: MergeVendorFormValues) => {
    setSuccess(null);
    setServerError(null);
    try {
      const result = await AssignUserToVendor(values);
      if (!result.success) {
        setServerError(result.message || "حدث خطأ");
        return;
      }
      setSuccess(result.message);
      reset();
    } catch (err) {
      console.error(err);
      setServerError("حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-1">ربط مورد بحساب</h1>
      <p className="text-sm text-gray-500 mb-6">
        اختر موردًا غير مرتبط بحساب وأنشئ له بيانات دخول
      </p>

      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-green-50 text-green-700">
          {success}
        </div>
      )}
      {serverError && (
        <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-700">
          {serverError}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-700">
          فشل في تحميل الموردين
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <SearchableSelectField
          id="vendorId"
          label="المورد"
          placeholder="-- ابحث واختر موردًا --"
          options={vendorOptions}
          loading={loading}
          value={vendorId}
          onChange={(val) =>
            setValue("vendorId", val, { shouldValidate: true })
          }
          error={errors.vendorId}
        />

        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          register={register("email")}
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="كلمة المرور"
          register={register("password")}
          error={errors.password}
        />

        <div className="flex justify-end mt-2">
          <Button loading={isSubmitting || loading} type="submit">
            ربط الحساب
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MergeVendorsForm;
