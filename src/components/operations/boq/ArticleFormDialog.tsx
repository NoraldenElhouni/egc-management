import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { TextField } from "../../ui/inputs/TextField";
import {
  ArticleFormValues,
  ArticleSchema,
} from "../../../types/schema/boq/article.schema";

const DEFAULT_VALUES: ArticleFormValues = { name: "" };

type ArticleFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ArticleFormValues) => void | Promise<void>;
  defaultValues?: ArticleFormValues;
  loading?: boolean;
};

const ArticleFormDialog: React.FC<ArticleFormDialogProps> = ({
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
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(ArticleSchema),
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
          {defaultValues ? "تعديل فصل" : "فصل جديد"}
        </h2>
        <TextField
          id="article-name"
          label="اسم الفصل"
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

export default ArticleFormDialog;
