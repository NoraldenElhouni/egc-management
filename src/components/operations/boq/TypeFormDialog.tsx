import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { TypeFormValues, TypeSchema } from "../../../types/schema/boq/type.schema";

const DEFAULT_VALUES: TypeFormValues = { name: "" };

type TypeFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TypeFormValues) => void | Promise<void>;
  defaultValues?: TypeFormValues;
  loading?: boolean;
};

const TypeFormDialog: React.FC<TypeFormDialogProps> = ({
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
  } = useForm<TypeFormValues>({
    resolver: zodResolver(TypeSchema),
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
          {defaultValues ? "تعديل نوع" : "نوع جديد"}
        </h2>
        <TextField
          id="type-name"
          label="اسم النوع"
          register={register("name")}
          error={errors.name}
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

export default TypeFormDialog;
