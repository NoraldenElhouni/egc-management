import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import {
  TemplateWorkFormValues,
  TemplateWorkSchema,
} from "../../../types/schema/boq/templateWork.schema";

const DEFAULT_VALUES: TemplateWorkFormValues = { name: "" };

type TemplateWorkFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateWorkFormValues) => void | Promise<void>;
  defaultValues?: TemplateWorkFormValues;
  loading?: boolean;
};

const TemplateWorkFormDialog: React.FC<TemplateWorkFormDialogProps> = ({
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
  } = useForm<TemplateWorkFormValues>({
    resolver: zodResolver(TemplateWorkSchema),
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
          {defaultValues ? "تعديل عمل القالب" : "عمل قالب جديد"}
        </h2>
        <TextField
          id="template-work-name"
          label="اسم العمل"
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

export default TemplateWorkFormDialog;
