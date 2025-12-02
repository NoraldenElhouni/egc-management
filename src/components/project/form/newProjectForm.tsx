import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SelectField } from "../../ui/inputs/SelectField";
import {
  ProjectFormValues,
  ProjectSchema,
} from "../../../types/schema/projects.schema";
import { useProjects } from "../../../hooks/useProjects";
import { useClients } from "../../../hooks/useClients";
import { NumberField } from "../../ui/inputs/NumberField";
import { useNavigate } from "react-router-dom";

const NewProjectForm: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const { addProject, loading, error } = useProjects();
  const { clients } = useClients();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ProjectSchema),
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const created = await addProject(data);
      if (!created || error) {
        alert("خطأ في إنشاء المشروع: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم اضافة المشروع بنجاح");
      reset();
      navigate(`/projects`);
    } catch (err) {
      console.error("Unexpected error creating project:", err);
      alert("حدث خطأ غير متوقع أثناء إنشاء المشروع.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة مشروع جديد</h1>

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
        <SelectField
          id="client_id"
          label="العميل"
          register={register("client_id")}
          error={errors.client_id}
          options={clients.map((c) => ({
            value: c.id,
            label: `${c.first_name} ${c.last_name ?? ""}`,
          }))}
          placeholder="-- اختر عميل --"
        />

        <TextField
          id="name"
          label="اسم المشروع"
          register={register("name")}
          error={errors.name}
        />

        <TextField
          id="address"
          label="العنوان"
          register={register("address")}
          error={errors.address}
        />

        <NumberField
          id="percentage"
          label="النسبة (%)"
          step="1"
          register={register("percentage", { valueAsNumber: true })}
          error={errors.percentage}
        />

        <div className="md:col-span-2">
          <label className="mb-1 text-sm text-foreground">وصف</label>
          <textarea
            {...register("description")}
            className="w-full border rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.description && (
            <p className="text-sm text-error mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2 flex justify-end gap-2 mt-3">
          <Button loading={loading} type="submit">
            اضافة المشروع
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;
