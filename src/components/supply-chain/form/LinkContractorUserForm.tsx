import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContractorsNoUser } from "../../../hooks/useContractors";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import Button from "../../ui/Button";
import { useNavigate } from "react-router-dom";
import { AssignUserToContractor } from "../../../services/contractors/setContractors";

const MergeContractorSchema = z.object({
  contractorId: z.string().min(1, "يجب اختيار المقاول"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف"),
});

type MergeContractorFormValues = z.infer<typeof MergeContractorSchema>;

const MergeContractorsForm = () => {
  const { contractors, error, loading } = useContractorsNoUser();
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MergeContractorFormValues>({
    resolver: zodResolver(MergeContractorSchema),
    defaultValues: {
      contractorId: "",
      email: "",
      password: "",
    },
  });

  const contractorId = watch("contractorId");

  const contractorOptions = contractors.map((c) => ({
    value: c.id,
    label: `${c.first_name}${c.last_name ? " " + c.last_name : ""}${c.phone_number ? " — " + c.phone_number : ""}`,
  }));

  const onSubmit = async (values: MergeContractorFormValues) => {
    setSuccess(null);
    setServerError(null);
    try {
      await AssignUserToContractor(values);
      setSuccess("تم ربط الحساب بالمقاول بنجاح");
      reset();
      navigate("/supply-chain/contractors");
    } catch (err) {
      console.error(err);
      setServerError("حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-1">ربط مقاول بحساب</h1>
      <p className="text-sm text-gray-500 mb-6">
        اختر مقاولاً غير مرتبط بحساب وأنشئ له بيانات دخول
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
          فشل في تحميل المقاولين
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Contractor searchable select */}
        <SearchableSelectField
          id="contractorId"
          label="المقاول"
          placeholder="-- ابحث واختر مقاولاً --"
          options={contractorOptions}
          loading={loading}
          value={contractorId}
          onChange={(val) =>
            setValue("contractorId", val, { shouldValidate: true })
          }
          error={errors.contractorId}
        />

        {/* Email */}
        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          register={register("email")}
          error={errors.email}
        />

        {/* Password */}
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

export default MergeContractorsForm;
