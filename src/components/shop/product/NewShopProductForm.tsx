// components/shop/product/NewShopProductForm.tsx
import React, { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { NumberField } from "../../ui/inputs/NumberField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { useSubcategories } from "../../../hooks/shop/subcategories/useSubcategories";
import { useProducts } from "../../../hooks/shop/products/useProducts";
import {
  ShopProductFormValues,
  ShopProductSchema,
} from "../../../types/schema/shop/product.schema";
import { Trash2, Plus } from "lucide-react";

const STEPS = [
  { id: 1, label: "بيانات المنتج" },
  { id: 2, label: "المقاسات والأسعار" },
  { id: 3, label: "مراجعة" },
] as const;

const NewShopProductForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState<string | null>(null);
  const { addProduct, loading, error } = useProducts();
  const { subcategories } = useSubcategories();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
    reset,
  } = useForm<ShopProductFormValues>({
    resolver: zodResolver(ShopProductSchema),
    defaultValues: {
      is_active: true,
      sizes: [{ name: "", unit: "", sku: "", price: 0, is_active: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sizes",
  });

  const watched = watch();

  // IMPORTANT: accept the click event and stop it from bubbling up
  // to the form's onSubmit handler. This is the core fix.
  const goNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    const fieldsToValidate: (keyof ShopProductFormValues)[] =
      step === 1
        ? ["name", "subcategory_id", "description", "image_path"]
        : ["sizes"];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: ShopProductFormValues) => {
    // Extra safety net: only allow real submission on the final step.
    if (step !== STEPS.length) return;

    try {
      const created = await addProduct(data);
      if (!created || error) {
        alert("خطأ في إنشاء المنتج: " + (error?.message ?? ""));
        return;
      }
      setSuccess("تم اضافة المنتج بنجاح");
      reset();
      navigate(`/shops/products`);
    } catch (err) {
      console.error("Unexpected error creating shop product:", err);
      alert("حدث خطأ غير متوقع أثناء إنشاء المنتج.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-2">اضافة منتج جديد</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                  ${
                    step === s.id
                      ? "bg-primary text-white"
                      : step > s.id
                        ? "bg-success text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
              >
                {s.id}
              </div>
              <span
                className={`text-sm ${
                  step === s.id
                    ? "text-foreground font-medium"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-gray-200 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>

      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-success/10 text-success">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          // Prevent Enter key (e.g. while typing in a number/text field)
          // from auto-submitting the form before the final review step.
          if (e.key === "Enter" && step < STEPS.length) {
            e.preventDefault();
          }
        }}
        noValidate
      >
        {/* STEP 1: Product info */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              id="name"
              label="اسم المنتج"
              register={register("name")}
              error={errors.name}
            />

            <Controller
              name="subcategory_id"
              control={control}
              render={({ field }) => (
                <SearchableSelectField
                  id="subcategory_id"
                  label="التصنيف الفرعي"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.subcategory_id}
                  options={subcategories.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="-- اختر تصنيف فرعي --"
                />
              )}
            />

            <TextField
              id="image_path"
              label="مسار الصورة"
              register={register("image_path")}
              error={errors.image_path}
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

            <div className="md:col-span-2">
              <label className="mb-1 text-sm text-foreground block">
                الوصف
              </label>
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
          </div>
        )}

        {/* STEP 2: Sizes */}
        {step === 2 && (
          <div className="space-y-4">
            {errors.sizes?.root?.message && (
              <p className="text-sm text-error">{errors.sizes.root.message}</p>
            )}
            {errors.sizes?.message && (
              <p className="text-sm text-error">{errors.sizes.message}</p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    remove(index);
                  }}
                  disabled={fields.length === 1}
                  className="absolute top-3 left-3 text-error disabled:text-gray-300"
                  title="حذف المقاس"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <TextField
                  id={`sizes.${index}.name`}
                  label="اسم المقاس"
                  register={register(`sizes.${index}.name`)}
                  error={errors.sizes?.[index]?.name}
                />

                <TextField
                  id={`sizes.${index}.unit`}
                  label="الوحدة"
                  register={register(`sizes.${index}.unit`)}
                  error={errors.sizes?.[index]?.unit}
                />

                <TextField
                  id={`sizes.${index}.sku`}
                  label="SKU"
                  register={register(`sizes.${index}.sku`)}
                  error={errors.sizes?.[index]?.sku}
                />

                <NumberField
                  id={`sizes.${index}.price`}
                  label="السعر"
                  step="0.01"
                  register={register(`sizes.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  error={errors.sizes?.[index]?.price}
                />

                <TextField
                  id={`sizes.${index}.image_path`}
                  label="مسار الصورة (اختياري)"
                  register={register(`sizes.${index}.image_path`)}
                  error={errors.sizes?.[index]?.image_path}
                />

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id={`sizes.${index}.is_active`}
                    type="checkbox"
                    {...register(`sizes.${index}.is_active`)}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <label
                    htmlFor={`sizes.${index}.is_active`}
                    className="text-sm text-foreground"
                  >
                    نشط
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                append({
                  name: "",
                  unit: "",
                  sku: "",
                  price: 0,
                  is_active: true,
                });
              }}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> اضافة مقاس آخر
            </button>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500">اسم المنتج</p>
              <p className="font-medium">{watched.name}</p>
            </div>
            <div>
              <p className="text-gray-500">التصنيف الفرعي</p>
              <p className="font-medium">
                {subcategories.find((s) => s.id === watched.subcategory_id)
                  ?.name ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">الوصف</p>
              <p className="font-medium">{watched.description || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-2">
                المقاسات ({watched.sizes?.length})
              </p>
              <div className="space-y-2">
                {watched.sizes?.map((s, i) => (
                  <div
                    key={i}
                    className="border rounded px-3 py-2 flex justify-between"
                  >
                    <span>
                      {s.name} — {s.unit} — SKU: {s.sku}
                    </span>
                    <span className="font-medium">{s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2 mt-6">
          <div>
            {step > 1 && (
              <Button variant="secondary" type="button" onClick={goBack}>
                رجوع
              </Button>
            )}
          </div>

          <div>
            {step < STEPS.length ? (
              <Button type="button" onClick={goNext}>
                التالي
              </Button>
            ) : (
              <Button loading={loading} type="submit">
                اضافة المنتج
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewShopProductForm;
