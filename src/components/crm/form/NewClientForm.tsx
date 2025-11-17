import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ClientFormValues,
  ClientSchema,
} from "../../../types/schema/clients.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import { SelectField } from "../../ui/inputs/SelectField";
import { useClients } from "../../../hooks/useClients";

const NewClientForm = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const { addClient, error, loading } = useClients();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      // Simulate API call

      await addClient(data);
      if (error) {
        alert("خطأ في إنشاء العميل: " + error.message);
        throw new Error(error.message);
      }
      setSuccess("تم اضافة العميل بنجاح");
      reset();
    } catch (error) {
      console.error("Unexpected error creating client:", error);
      alert("حدث خطأ غير متوقع أثناء إنشاء العميل.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة عميل جديد</h1>

      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-success/10 text-success">
          {success}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <TextField
          id="firstName"
          label="الاسم الاول"
          register={register("firstName")}
          error={errors.firstName}
        />

        <TextField
          id="lastName"
          label="اسم العائلة"
          register={register("lastName")}
          error={errors.lastName}
        />

        <TextField
          id="email"
          label="البريد الالكتروني"
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
        <TextField
          id="nationality"
          label="الجنسية"
          type="text"
          register={register("nationality")}
          error={errors.nationality}
        />
        <TextField
          id="company"
          label="اسم الشركة"
          type="text"
          register={register("company")}
          error={errors.company}
        />

        <SelectField
          id="gender"
          label="الحالة"
          register={register("gender")}
          error={errors.gender}
          options={[
            { value: "Male", label: "ذكر" },
            { value: "Female", label: "أنثى" },
          ]}
        />
        <SelectField
          id="status"
          label="الحالة"
          register={register("status")}
          error={errors.status}
          options={[
            { value: "Active", label: "نشط" },
            { value: "Inactive", label: "غير نشط" },
          ]}
        />

        <div className="md:col-span-2 flex justify-end gap-2 mt-3">
          <Button loading={loading} type="submit">
            اضافة العميل
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewClientForm;
