import React, { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { NumberField } from "../../ui/inputs/NumberField";
import {
  TemplateItemFormValues,
  TemplateItemSchema,
} from "../../../types/schema/boq/templateItem.schema";

const DEFAULT_VALUES: TemplateItemFormValues = {
  name: "",
  unit: "",
  default_quantity: 1,
  default_unit_price: null,
};

type TemplateItemFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateItemFormValues) => void | Promise<void>;
  defaultValues?: TemplateItemFormValues;
  loading?: boolean;
};

const TemplateItemFormDialog: React.FC<TemplateItemFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateItemFormValues>({
    resolver: zodResolver(
      TemplateItemSchema,
    ) as Resolver<TemplateItemFormValues>,
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(defaultValues ?? DEFAULT_VALUES);
  }, [isOpen, defaultValues, reset]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">
          {defaultValues ? "تعديل بند القالب" : "بند قالب جديد"}
        </h2>
        <TextField
          id="template-item-name"
          label="اسم البند"
          register={register("name")}
          error={errors.name}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="template-item-unit"
            label="الوحدة"
            register={register("unit")}
            error={errors.unit}
          />
          <NumberField
            id="template-item-default-quantity"
            label="الكمية الافتراضية"
            step="0.01"
            register={register("default_quantity", { valueAsNumber: true })}
            error={errors.default_quantity}
          />
        </div>
        <NumberField
          id="template-item-default-unit-price"
          label="سعر الوحدة الافتراضي (اختياري)"
          step="0.01"
          register={register("default_unit_price")}
          error={errors.default_unit_price}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading}>
            {defaultValues ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default TemplateItemFormDialog;
