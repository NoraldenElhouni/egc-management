// components/shop/division/EditShopDivisionForm.tsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostgrestError } from "@supabase/supabase-js";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { IconPickerField } from "../../ui/inputs/IconPickerField";
import { useSpecializations } from "../../../hooks/useSpecializations";
import {
  ShopDivisionFormValues,
  ShopDivisionSchema,
} from "../../../types/schema/shop/division.schema";
import { Divisions, expenses } from "../../../types/global.type";

interface EditShopDivisionFormProps {
  defaultValues: ShopDivisionFormValues;
  expenses: expenses[];
  updateDivision: (
    updates: Partial<Omit<Divisions, "id" | "created_at">>,
  ) => Promise<Divisions | null>;
  loading: boolean;
  error: PostgrestError | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EditShopDivisionForm: React.FC<EditShopDivisionFormProps> = ({
  defaultValues,
  expenses,
  updateDivision,
  loading,
  error,
  onSaved,
  onCancel,
}) => {
  const [success, setSuccess] = useState<string | null>(null);
  const { data: specializations } = useSpecializations("Vendor");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ShopDivisionSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: ShopDivisionFormValues) => {
    try {
      const updated = await updateDivision(data);
      if (!updated || error) {
        alert("خطأ في تعديل القسم: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم تعديل القسم بنجاح");
      onSaved();
    } catch (err) {
      console.error("Unexpected error updating shop division:", err);
      alert("حدث خطأ غير متوقع أثناء تعديل القسم.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">تعديل القسم</h1>

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
          label="اسم القسم"
          register={register("name")}
          error={errors.name}
        />

        <Controller
          name="specialization_id"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              id="specialization_id"
              label="التخصص"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.specialization_id}
              options={specializations.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              placeholder="-- اختر تخصص --"
            />
          )}
        />

        <Controller
          name="expense_id"
          control={control}
          render={({ field }) => (
            <SearchableSelectField
              id="expense_id"
              label="المصروف الافتراضي"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.expense_id}
              options={expenses.map((e) => ({
                value: e.id,
                label: e.name,
              }))}
              placeholder="-- اختر مصروف --"
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

        <div className="flex items-center gap-2 mt-6">
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

export default EditShopDivisionForm;
