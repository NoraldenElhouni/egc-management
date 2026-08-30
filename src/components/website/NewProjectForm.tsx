import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "../ui/inputs/TextField";
import { TextAreaField } from "../ui/inputs/TextAreaField";
import { SelectField } from "../ui/inputs/SelectField";
import Button from "../ui/Button";
import { useCategoriesQuery } from "../../hooks/website/useCategories";
import { useCreateProject } from "../../hooks/website/useProjects";
import {
  NewProjectFormValues,
  NewProjectSchema,
} from "../../types/schema/website/newProject.schema";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const NewProjectForm = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const { mutateAsync: createProject, isPending } = useCreateProject();

  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(NewProjectSchema),
    defaultValues: { is_active: true, is_featured: false },
  });

  const onSubmit = async (values: NewProjectFormValues) => {
    setError(null);
    try {
      await createProject(values);
      navigate("/settings/website/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إنشاء المشروع");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        مشروع جديد
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded text-sm bg-error/10 text-error">
          {error}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <SelectField
          id="category_id"
          label="التصنيف"
          register={register("category_id")}
          error={errors.category_id}
          options={(categories ?? []).map((c) => ({
            value: c.id,
            label: c.name_ar,
          }))}
        />

        <TextField
          id="year"
          label="السنة"
          register={register("year")}
          error={errors.year}
        />

        <TextField
          id="title_ar"
          label="العنوان بالعربية"
          register={register("title_ar")}
          error={errors.title_ar}
        />
        <TextField
          id="title_en"
          label="العنوان بالإنجليزية"
          register={register("title_en", {
            onChange: (e) => {
              if (!slugTouched) {
                setValue("slug", slugify(e.target.value));
              }
            },
          })}
          error={errors.title_en}
        />

        <TextField
          id="slug"
          label="الرابط المختصر (slug)"
          register={register("slug", {
            onChange: () => setSlugTouched(true),
          })}
          error={errors.slug}
        />
        <div />

        <TextField
          id="client_ar"
          label="العميل بالعربية"
          register={register("client_ar")}
          error={errors.client_ar}
        />
        <TextField
          id="client_en"
          label="العميل بالإنجليزية"
          register={register("client_en")}
          error={errors.client_en}
        />

        <TextField
          id="location_ar"
          label="الموقع بالعربية"
          register={register("location_ar")}
          error={errors.location_ar}
        />
        <TextField
          id="location_en"
          label="الموقع بالإنجليزية"
          register={register("location_en")}
          error={errors.location_en}
        />

        <TextField
          id="status_ar"
          label="الحالة بالعربية"
          register={register("status_ar")}
          error={errors.status_ar}
        />
        <TextField
          id="status_en"
          label="الحالة بالإنجليزية"
          register={register("status_en")}
          error={errors.status_en}
        />

        <TextAreaField
          id="description_ar"
          label="الوصف بالعربية"
          register={register("description_ar")}
          error={errors.description_ar}
        />
        <TextAreaField
          id="description_en"
          label="الوصف بالإنجليزية"
          register={register("description_en")}
          error={errors.description_en}
        />

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("is_active")} />
          مفعّل
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register("is_featured")} />
          مميز
        </label>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/settings/website/projects")}
          >
            إلغاء
          </Button>
          <Button type="submit" loading={isPending}>
            إنشاء المشروع
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;
