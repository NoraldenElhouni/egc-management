import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { TextField } from "../ui/inputs/TextField";
import {
  ProjectImageFormValues,
  ProjectImageSchema,
} from "../../types/schema/website/projectImage.schema";

type ProjectImageFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectImageFormValues) => void | Promise<void>;
  loading?: boolean;
};

const ProjectImageFormDialog: React.FC<ProjectImageFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectImageFormValues>({
    resolver: zodResolver(ProjectImageSchema),
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const file = watch("file");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">صورة مشروع جديدة</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-foreground">الصورة</label>

          {previewUrl ? (
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border">
              <img
                src={previewUrl}
                alt="معاينة"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImagePlus className="w-8 h-8" />
              <span className="text-xs">لم يتم اختيار صورة بعد</span>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected)
                setValue("file", selected, { shouldValidate: true });
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {errors.file && (
            <p className="text-sm text-error">{errors.file.message}</p>
          )}
        </div>

        <TextField
          id="project-image-alt-ar"
          label="النص البديل بالعربية"
          register={register("alt_ar")}
          error={errors.alt_ar}
        />
        <TextField
          id="project-image-alt-en"
          label="النص البديل بالإنجليزية"
          register={register("alt_en")}
          error={errors.alt_en}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading}>
            إضافة
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default ProjectImageFormDialog;
