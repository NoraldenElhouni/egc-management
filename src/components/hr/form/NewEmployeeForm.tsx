import React, { useState } from "react";
import Button from "../../ui/Button";
import { userSchema, UserFormValues } from "../../../types/schema/users.shema";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "../../ui/inputs/TextField";
import { PasswordField } from "../../ui/inputs/PasswordField";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";
import { NumberField } from "../../ui/inputs/NumberField";
import { createEmployee } from "../../../services/employees/setEmployeeService";

const NewEmployeeForm: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    // Cast resolver to the expected Resolver<UserFormValues> to avoid TS errors
    // when duplicate/react-hook-form type instances exist in the dependency tree.
    resolver: zodResolver(userSchema) as unknown as Resolver<UserFormValues>,
    defaultValues: {
      employeeType: "Full-Time",
      role: "Support",
      salaryType: "fixed",
      status: "Active",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      const response = await createEmployee(data);
      if (!response.success) {
        alert("خطأ في إنشاء الموظف: " + response.message);
        throw new Error(response.message);
      }
      setSuccess("تم اضافة الموظف بنجاح");
      reset();
    } catch (error) {
      console.error("Unexpected error creating employee:", error);
      alert("حدث خطأ غير متوقع أثناء إنشاء الموظف.");
    } finally {
      setLoading(false);
    }
  };

  const employeeTypeOptions = [
    { value: "Full-Time", label: "Full-Time" },
    { value: "Part-Time", label: "Part-Time" },
    { value: "Contractor", label: "Contractor" },
    { value: "Intern", label: "Intern" },
  ];

  const roleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "HR", label: "HR" },
    { value: "Finance", label: "Finance" },
    { value: "Sales", label: "Sales" },
    { value: "Support", label: "Support" },
    { value: "Bookkeeper", label: "Bookkeeper" },
    { value: "Accountant", label: "Accountant" },
  ];

  const salaryTypeOptions = [
    { value: "fixed", label: "fixed" },
    { value: "percentage", label: "percentage" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة موظف جديد</h1>

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
          id="employeeId"
          label="معرف الموظف"
          register={register("employeeId")}
          error={errors.employeeId}
        />

        <PasswordField
          id="password"
          label="كلمة المرور"
          register={register("password")}
          error={errors.password}
        />

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

        <DateField
          id="dateOfBirth"
          label="تاريخ الميلاد"
          register={register("dob")}
          error={errors.dob}
        />

        <TextField
          id="email"
          label="البريد الالكتروني"
          type="email"
          register={register("email")}
          error={errors.email}
        />

        <TextField
          id="phone"
          label="الهاتف (اختياري)"
          register={register("phone")}
          error={errors.phone}
        />

        <SelectField
          id="employeeType"
          label="نوع الموظف"
          options={employeeTypeOptions}
          register={register("employeeType")}
          error={errors.employeeType}
        />

        <TextField
          id="jobTitle"
          label="المسمى الوظيفي"
          register={register("jobTitle")}
          error={errors.jobTitle}
        />

        <TextField
          id="department"
          label="القسم"
          register={register("department")}
          error={errors.department}
        />

        <SelectField
          id="role"
          label="الدور"
          options={roleOptions}
          register={register("role")}
          error={errors.role}
        />

        <SelectField
          id="salaryType"
          label="نوع الراتب"
          options={salaryTypeOptions}
          register={register("salaryType")}
          error={errors.salaryType}
        />

        <NumberField
          id="baseSalary"
          label="الراتب الاساسي (اختياري)"
          step={100}
          register={register("baseSalary", { valueAsNumber: true })}
          error={errors.baseSalary}
        />

        <div className="md:col-span-2 flex justify-end gap-2 mt-3">
          <Button loading={loading} type="submit">
            اضافة موظف
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewEmployeeForm;
