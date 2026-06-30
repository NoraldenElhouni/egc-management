import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostgrestError } from "@supabase/supabase-js";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import {
  ShopSubcategoryFormValues,
  ShopSubcategorySchema,
} from "../../../types/schema/shop/subcategory.schema";
import { Subcategories } from "../../../types/global.type";

interface EditShopSubcategoryFormProps {
  defaultValues: ShopSubcategoryFormValues;
  updateSubcategory: (
    updates: Partial<Omit<Subcategories, "id" | "created_at">>,
  ) => Promise<Subcategories | null>;
  loading: boolean;
  error: PostgrestError | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EditShopSubcategoryForm: React.FC<EditShopSubcategoryFormProps> = ({
  defaultValues,
  updateSubcategory,
  loading,
  error,
  onSaved,
  onCancel,
}) => {
  const [success, setSuccess] = useState<string | null>(null);
  const { categories } = useCategories();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ShopSubcategorySchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: ShopSubcategoryFormValues) => {
    try {
      const updated = await updateSubcategory(data);
      if (!updated || error) {
        alert("خطأ في تعديل التصنيف الفرعي: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم تعديل التصنيف الفرعي بنجاح");
      onSaved();
    } catch (err) {
      console.error("Unexpected error updating shop subcategory:", err);
      alert("حدث خطأ غير متوقع أثناء تعديل التصنيف الفرعي.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">تعديل التصنيف الفرعي</h1>

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
          label="اسم التصنيف الفرعي"
          register={register("name")}
          error={errors.name}
        />

        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              id="category_id"
              label="التصنيف الرئيسي"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.category_id}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="-- اختر تصنيف رئيسي --"
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

export default EditShopSubcategoryForm;
