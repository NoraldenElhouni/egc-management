import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";

import { useSpecializations } from "../../../hooks/useSpecializations";
import { useNavigate } from "react-router-dom";
import { useDivisions } from "../../../hooks/shop/divisions/useDivisions";
import {
  ShopDivisionFormValues,
  ShopDivisionSchema,
} from "../../../types/schema/shop/division.schema";
import { IconPickerField } from "../../ui/inputs/IconPickerField";

const NewShopDivisionForm: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const { addDivision, loading, error } = useDivisions();
  const { data: specializations } = useSpecializations("Vendor");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ShopDivisionSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const onSubmit = async (data: ShopDivisionFormValues) => {
    try {
      const created = await addDivision(data);
      if (!created || error) {
        alert("خطأ في إنشاء القسم: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم اضافة القسم بنجاح");
      reset();
      navigate(`/shops/divisions`);
    } catch (err) {
      console.error("Unexpected error creating shop division:", err);
      alert("حدث خطأ غير متوقع أثناء إنشاء القسم.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة قسم جديد</h1>

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
          <Button loading={loading} type="submit">
            اضافة القسم
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewShopDivisionForm;
