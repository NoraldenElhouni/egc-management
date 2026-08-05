import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { NumberField } from "../../ui/inputs/NumberField";
import { SelectField } from "../../ui/inputs/SelectField";
import { ItemFormValues, ItemSchema } from "../../../types/schema/boq/item.schema";
import { Zone } from "../../../hooks/operations/boq/useZones";

const DEFAULT_VALUES: ItemFormValues = {
  name: "",
  unit: "",
  quantity: 1,
  unit_price: null,
  zone_id: "",
};

type ItemFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  defaultValues?: ItemFormValues;
  zones: Zone[];
  onRequestCreateZone: () => void;
  loading?: boolean;
};

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  zones,
  onRequestCreateZone,
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

  const zoneOptions = zones.map((z) => ({ value: z.id, label: z.name }));

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

        {zones.length === 0 ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="mb-2">لا توجد مناطق بعد — أنشئ منطقة أولاً</p>
            <Button
              type="button"
              size="sm"
              variant="primary-outline"
              onClick={onRequestCreateZone}
            >
              + منطقة جديدة
            </Button>
          </div>
        ) : (
          <SelectField
            id="item-zone"
            label="المنطقة"
            options={zoneOptions}
            register={register("zone_id")}
            error={errors.zone_id}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading} disabled={zones.length === 0}>
            {defaultValues ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default ItemFormDialog;
