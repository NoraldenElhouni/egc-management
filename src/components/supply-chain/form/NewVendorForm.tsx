import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  VendorFormValues,
  vendorsSchema,
} from "../../../types/schema/vendor.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import { addVendor } from "../../../services/vendors/setVendors";
import { useSpecializations } from "../../../hooks/useSpecializations";
import { SelectField } from "../../ui/inputs/SelectField";

const NewVendorForm = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: specializations, loading: spLoading } =
    useSpecializations("Vendor");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorsSchema),
  });

  const onSubmit = async (values: VendorFormValues) => {
    setSuccess(null);
    setServerError(null);
    try {
      setServerError(null);
      setSuccess(null);
      const result = await addVendor(values);

      if (!result.success) {
        setServerError(result.message || "An error occurred");
        return;
      }

      setSuccess(result.message || "تم إضافة المقاول بنجاح");
      reset();
      navigate("/supply-chain"); // choose your route
    } catch (error) {
      console.error("Error adding contractor:", error);
      setServerError("An unexpected error occurred");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة مقاول جديد</h1>

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

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <TextField
          id="vendor_name"
          label="اسم المورد"
          register={register("vendor_name")}
          error={errors.vendor_name}
        />
        <TextField
          id="contact_name"
          label="اسم جهة الاتصال"
          register={register("contact_name")}
          error={errors.contact_name}
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

        <SelectField
          id="specializationIds"
          options={specializations.map((s) => ({ value: s.id, label: s.name }))}
          label="تخصص"
          register={register("specialization_id")}
          error={errors.specialization_id}
        />

        <TextField
          id="phone_number"
          label="رقم الهاتف"
          type="text"
          register={register("phone_number")}
          error={errors.phone_number}
        />
        <TextField
          id="alt_phone_number"
          label="رقم الهاتف البديل"
          type="text"
          register={register("alt_phone_number")}
          error={errors.alt_phone_number}
        />
        <TextField
          id="country"
          label="البلد"
          register={register("country")}
          error={errors.country}
        />
        <TextField
          id="city"
          label="المدينة"
          register={register("city")}
          error={errors.city}
        />
        <TextField
          id="address"
          label="العنوان"
          register={register("address")}
          error={errors.address}
        />

        <div className="md:col-span-2 flex justify-end gap-2 mt-3">
          <Button loading={isSubmitting || spLoading} type="submit">
            إضافة مقاول
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewVendorForm;
