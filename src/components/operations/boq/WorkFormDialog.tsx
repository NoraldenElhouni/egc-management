import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import { WorkFormValues, WorkSchema } from "../../../types/schema/boq/work.schema";

const DEFAULT_VALUES: WorkFormValues = { name: "" };

type WorkFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: WorkFormValues) => void | Promise<void>;
  defaultValues?: WorkFormValues;
  loading?: boolean;
};

const WorkFormDialog: React.FC<WorkFormDialogProps> = ({
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
  } = useForm<WorkFormValues>({
    resolver: zodResolver(WorkSchema),
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
          {defaultValues ? "تعديل عمل" : "عمل جديد"}
        </h2>
        <TextField
          id="work-name"
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

export default WorkFormDialog;
