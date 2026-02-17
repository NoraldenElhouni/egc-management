import { useEffect, useState } from "react";
import { useMaps } from "../../../hooks/projects/useBookProjects";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjectMapsSchema,
  ProjectMapsValues,
} from "../../../types/schema/ProjectBook.schema";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { NumberField } from "../../ui/inputs/NumberField";
import { SelectField } from "../../ui/inputs/SelectField";
import { DateField } from "../../ui/inputs/DateField";
import Button from "../../ui/Button";

interface ProjectMapsFormProps {
  project_id: string;
}
const ProjectMapsForm = ({ project_id }: ProjectMapsFormProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { addMaps, maps, loading, error } = useMaps(project_id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectMapsValues>({
    resolver: zodResolver(ProjectMapsSchema),
    defaultValues: {
      project_id: project_id,
      date: new Date().toISOString().split("T")[0],
    },
  });
  console.log("ProjectMapsForm maps:", project_id);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  const onSubmit = async (data: ProjectMapsValues) => {
    try {
      setSubmitError(null);
      const result = await addMaps(data);

      if (result.error) {
        setSubmitError("error");
        return;
      }
      setSuccess("تم إضافة الدخل بنجاح!");
      window.location.reload();
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("حدث خطأ أثناء إضافة الدخل");
    }
  };
  return (
    <div className="p-2 text-sm">
      {success && (
        <div className="mb-3 p-2 rounded text-xs bg-success/10 text-success">
          {success}
        </div>
      )}
      {submitError && (
        <div className="mb-3 p-2 rounded text-xs bg-error/10 text-error">
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <SearchableSelectField
            id="map_id"
            label="المصروف"
            value={watch("map_id")}
            onChange={(value) => {
              setValue("map_id", value);
              const selected = maps.find((e) => e.id === value);
              setValue("description", selected ? selected.name : "");
            }}
            loading={loading}
            options={maps
              .sort((a, b) =>
                a.name.localeCompare(b.name, "ar", { sensitivity: "base" }),
              )
              .map((map) => ({
                value: map.id,
                label: map.name,
              }))}
            placeholder={error ? "فشل تحميل المصروفات" : "اختار المصروف"}
            error={errors.map_id}
          />

          <NumberField
            id="amount"
            label="القيمة"
            register={register("amount", { valueAsNumber: true })}
            error={errors.amount}
          />
          <SelectField
            id="payment_method"
            label="طريقة الدفع"
            register={register("payment_method")}
            error={errors.payment_method}
            options={[
              { value: "cash", label: "نقداً" },
              { value: "bank", label: "عن طريق البنك" },
            ]}
          />
          <DateField
            id="date"
            label="التاريخ"
            register={register("date")}
            error={errors.date}
          />
          <div className="flex justify-end items-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإرسال..." : "إرسال الدخل"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectMapsForm;
