import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { TextField } from "../ui/inputs/TextField";
import { SearchableSelectField } from "../ui/inputs/SearchableSelectField";
import { LocationPicker } from "../ui/inputs/LocationPicker";
import {
  ProjectEditFormValues,
  ProjectEditSchema,
} from "../../types/schema/projects.schema";
import { useClients } from "../../hooks/useClients";
import { ProjectOverview } from "../../hooks/projects/useProjectOverview";

const STATUS_OPTIONS: { value: ProjectEditFormValues["status"]; label: string }[] = [
  { value: "active", label: "نشط" },
  { value: "paused", label: "متوقف" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

type EditProjectDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectOverview;
  onSubmit: (values: ProjectEditFormValues) => void | Promise<void>;
  loading?: boolean;
};

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmit,
  loading = false,
}) => {
  const { clients, loading: clientsLoading } = useClients();

  const defaultValues: ProjectEditFormValues = {
    client_id: project.client_id,
    name: project.name,
    address: project.address,
    description: project.description,
    status: project.status,
    latitude: project.latitude,
    longitude: project.longitude,
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectEditFormValues>({
    resolver: zodResolver(ProjectEditSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) reset(defaultValues);
  }, [isOpen, project, reset]);

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const handleMapClick = (lat: number, lng: number) => {
    setValue("latitude", Number(lat.toFixed(6)), { shouldValidate: true });
    setValue("longitude", Number(lng.toFixed(6)), { shouldValidate: true });
  };

  const submit = async (values: ProjectEditFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">تعديل بيانات المشروع</h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <SearchableSelectField
                id="edit-project-client_id"
                label="العميل"
                placeholder="-- اختر عميل --"
                error={errors.client_id}
                loading={clientsLoading}
                value={field.value}
                onChange={field.onChange}
                options={clients.map((c) => ({
                  value: c.id,
                  label: `${c.first_name} ${c.last_name ?? ""}`,
                }))}
              />
            )}
          />

          <TextField
            id="edit-project-name"
            label="اسم المشروع"
            register={register("name")}
            error={errors.name}
          />

          <TextField
            id="edit-project-address"
            label="العنوان"
            register={register("address")}
            error={errors.address}
          />

          <div className="flex flex-col">
            <label
              htmlFor="edit-project-status"
              className="mb-1 text-sm text-foreground"
            >
              الحالة
            </label>
            <select
              id="edit-project-status"
              {...register("status")}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-sm text-error mt-1">{errors.status.message}</p>
            )}
          </div>

          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={handleMapClick}
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

          <div className="md:col-span-2 flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading}>
              حفظ
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default EditProjectDialog;
