import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";

import {
  ContractorSchema,
  ContractorFormValues,
} from "../../../types/schema/contractors.schema";
import { useSpecializations } from "../../../hooks/useSpecializations";
import { SelectField } from "../../ui/inputs/SelectField";
import { AddContractors } from "../../../services/contractors/setContractors";

const NewContractorForm = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: specializations, loading: spLoading } =
    useSpecializations("Contractor");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(ContractorSchema),
  });

  const onSubmit = async (values: ContractorFormValues) => {
    setSuccess(null);
    setServerError(null);
    try {
      setServerError(null);
      setSuccess(null);
      const result = await AddContractors(values);

      if (!result.success) {
        setServerError(result.message || "An error occurred");
        return;
      }

      setSuccess(result.message || "تم إضافة المقاول بنجاح");
      reset();
      navigate("/supply-chain/contractors"); // choose your route
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
          id="firstName"
          label="الاسم الأول"
          register={register("firstName")}
          error={errors.firstName}
        />
        <TextField
          id="lastName"
          label="الاسم الأخير"
          register={register("lastName")}
          error={errors.lastName}
        />
        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          register={register("email")}
          error={errors.email}
        />

        <TextField
          id="phone"
          label="رقم الهاتف"
          type="text"
          register={register("phone")}
          error={errors.phone}
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
          register={register("specializationId")}
          error={errors.specializationId}
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

export default NewContractorForm;
