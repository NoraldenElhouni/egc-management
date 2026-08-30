import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { TextField } from "../ui/inputs/TextField";
import { TextAreaField } from "../ui/inputs/TextAreaField";
import { SelectField } from "../ui/inputs/SelectField";
import { Category } from "../../hooks/website/useCategories";
import {
  NewProjectFormValues,
  PROJECT_STATUS_OPTIONS,
} from "../../types/schema/website/newProject.schema";

type ProjectFormFieldsProps = {
  register: UseFormRegister<NewProjectFormValues>;
  errors: FieldErrors<NewProjectFormValues>;
  categories: Category[];
  onTitleEnChange?: (value: string) => void;
  onSlugChange?: () => void;
};

const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
  register,
  errors,
  categories,
  onTitleEnChange,
  onSlugChange,
}) => {
  return (
    <>
      <SelectField
        id="category_id"
        label="التصنيف"
        register={register("category_id")}
        error={errors.category_id}
        options={categories.map((c) => ({ value: c.id, label: c.name_ar }))}
      />

      <SelectField
        id="status"
        label="الحالة"
        register={register("status")}
        error={errors.status}
        options={PROJECT_STATUS_OPTIONS.map((o) => ({
          value: o.value,
          label: `${o.ar} (${o.en})`,
        }))}
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
        register={register(
          "title_en",
          onTitleEnChange
            ? { onChange: (e) => onTitleEnChange(e.target.value) }
            : undefined,
        )}
        error={errors.title_en}
      />

      <TextField
        id="slug"
        label="الرابط المختصر (slug)"
        register={register(
          "slug",
          onSlugChange ? { onChange: onSlugChange } : undefined,
        )}
        error={errors.slug}
      />
      <TextField
        id="year"
        label="السنة"
        register={register("year")}
        error={errors.year}
      />

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
    </>
  );
};

export default ProjectFormFields;
