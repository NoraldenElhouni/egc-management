import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { TextField } from "../ui/inputs/TextField";
import {
  CategoryFormValues,
  CategorySchema,
} from "../../types/schema/website/category.schema";

const DEFAULT_VALUES: CategoryFormValues = { name_ar: "", name_en: "" };

type CategoryFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  loading?: boolean;
};

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-lg font-bold">تصنيف جديد</h2>
        <TextField
          id="category-name-ar"
          label="الاسم بالعربية"
          register={register("name_ar")}
          error={errors.name_ar}
        />
        <TextField
          id="category-name-en"
          label="الاسم بالإنجليزية"
          register={register("name_en")}
          error={errors.name_en}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={loading}>
            إنشاء
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default CategoryFormDialog;
