// components/shop/category/EditShopCategoryForm.tsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostgrestError } from "@supabase/supabase-js";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { IconPickerField } from "../../ui/inputs/IconPickerField";
import { useDivisions } from "../../../hooks/shop/divisions/useDivisions";
import {
  ShopCategoryFormValues,
  ShopCategorySchema,
} from "../../../types/schema/shop/category.schema";
import { Categories } from "../../../types/global.type";

interface EditShopCategoryFormProps {
  defaultValues: ShopCategoryFormValues;
  updateCategory: (
    updates: Partial<Omit<Categories, "id" | "created_at">>,
  ) => Promise<Categories | null>;
  loading: boolean;
  error: PostgrestError | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EditShopCategoryForm: React.FC<EditShopCategoryFormProps> = ({
  defaultValues,
  updateCategory,
  loading,
  error,
  onSaved,
  onCancel,
}) => {
  const [success, setSuccess] = useState<string | null>(null);
  const { divisions } = useDivisions();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ShopCategorySchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: ShopCategoryFormValues) => {
    try {
      const updated = await updateCategory(data);
      if (!updated || error) {
        alert("خطأ في تعديل التصنيف: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم تعديل التصنيف بنجاح");
      onSaved();
    } catch (err) {
      console.error("Unexpected error updating shop category:", err);
      alert("حدث خطأ غير متوقع أثناء تعديل التصنيف.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">تعديل التصنيف</h1>

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
          id="name"
          label="اسم التصنيف"
          register={register("name")}
          error={errors.name}
        />

        <Controller
          name="division_id"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              id="division_id"
              label="القسم"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.division_id}
              options={divisions.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              placeholder="-- اختر قسم --"
            />
          )}
        />

        <Controller
          name="icon_path"
          control={control}
          render={({ field }) => (
            <IconPickerField
              id="icon_path"
              label="الايقونة"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.icon_path}
              placeholder="-- اختر ايقونة --"
            />
          )}
        />

        <div className="md:col-span-2">
          <label className="mb-1 text-sm text-foreground block">الوصف</label>
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

        <div className="flex items-center gap-2 mt-2">
          <input
            id="is_active"
            type="checkbox"
            {...register("is_active")}
            className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm text-foreground">
            نشط
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end gap-2 mt-3">
          <Button variant="secondary" type="button" onClick={onCancel}>
            إلغاء
          </Button>
          <Button loading={loading} type="submit">
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditShopCategoryForm;
