import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { TextField } from "../ui/inputs/TextField";
import {
  ProjectImageAltFormValues,
  ProjectImageAltSchema,
} from "../../types/schema/website/projectImage.schema";

type ProjectImageAltFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectImageAltFormValues) => void | Promise<void>;
  defaultValues: ProjectImageAltFormValues;
  loading?: boolean;
};

const ProjectImageAltFormDialog: React.FC<ProjectImageAltFormDialogProps> = ({
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
  } = useForm<ProjectImageAltFormValues>({
    resolver: zodResolver(ProjectImageAltSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) reset(defaultValues);
  }, [isOpen, defaultValues, reset]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">تعديل النص البديل</h2>
        <TextField
          id="project-image-edit-alt-ar"
          label="النص البديل بالعربية"
          register={register("alt_ar")}
          error={errors.alt_ar}
        />
        <TextField
          id="project-image-edit-alt-en"
          label="النص البديل بالإنجليزية"
          register={register("alt_en")}
          error={errors.alt_en}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading}>
            حفظ
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default ProjectImageAltFormDialog;
