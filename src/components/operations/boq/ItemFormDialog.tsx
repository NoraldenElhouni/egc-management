import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { NumberField } from "../../ui/inputs/NumberField";
import { ItemFormValues, ItemSchema } from "../../../types/schema/boq/item.schema";

const DEFAULT_VALUES: ItemFormValues = {
  name: "",
  unit: "",
  quantity: 1,
  unit_price: null,
};

type ItemFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  defaultValues?: ItemFormValues;
  loading?: boolean;
};

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
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
  } = useForm<ItemFormValues>({
    resolver: zodResolver(ItemSchema),
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
          {defaultValues ? "تعديل بند" : "بند جديد"}
        </h2>
        <TextField
          id="item-name"
          label="اسم البند"
          register={register("name")}
          error={errors.name}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="item-unit"
            label="الوحدة"
            register={register("unit")}
            error={errors.unit}
          />
          <NumberField
            id="item-quantity"
            label="الكمية"
            step="0.01"
            register={register("quantity", { valueAsNumber: true })}
            error={errors.quantity}
          />
        </div>
        <NumberField
          id="item-unit-price"
          label="سعر الوحدة (اختياري)"
          step="0.01"
          register={register("unit_price")}
          error={errors.unit_price}
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

export default ItemFormDialog;
