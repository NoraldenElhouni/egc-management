import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Star, X } from "lucide-react";
import Button from "../ui/Button";
import ProjectFormFields from "./ProjectFormFields";
import { useCategoriesQuery } from "../../hooks/website/useCategories";
import { useCreateProject } from "../../hooks/website/useProjects";
import { useUploadProjectImages } from "../../hooks/website/useProjectImages";
import {
  NewProjectFormValues,
  NewProjectSchema,
} from "../../types/schema/website/newProject.schema";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const NewProjectForm = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const { mutateAsync: createProject, isPending: creating } =
    useCreateProject();
  const { mutateAsync: uploadProjectImages, isPending: uploadingImages } =
    useUploadProjectImages();

  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const previewUrls = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images],
  );

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(NewProjectSchema),
    defaultValues: { is_active: true, is_featured: false },
  });

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setCoverIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const onSubmit = async (values: NewProjectFormValues) => {
    setError(null);
    try {
      const project = await createProject(values);

      if (images.length > 0) {
        await uploadProjectImages({
          projectId: project.id,
          slug: project.slug,
          titleAr: values.title_ar,
          titleEn: values.title_en,
          files: images,
          coverIndex,
        });
      }

      navigate("/settings/website/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إنشاء المشروع");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        مشروع جديد
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded text-sm bg-error/10 text-error">
          {error}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <ProjectFormFields
          register={register}
          errors={errors}
          categories={categories ?? []}
          onTitleEnChange={(value) => {
            if (!slugTouched) setValue("slug", slugify(value));
          }}
          onSlugChange={() => setSlugTouched(true)}
        />

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-sm text-foreground">
            الصور — انقر على النجمة لاختيار صورة الغلاف
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={previewUrls[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => setCoverIndex(index)}
                  className={`absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-lg p-1.5 transition ${
                    index === coverIndex
                      ? "bg-amber-400 text-white"
                      : "bg-white/90 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-white"
                  }`}
                  title="تعيين كصورة غلاف"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 left-1.5 inline-flex items-center justify-center rounded-lg bg-white/90 p-1.5 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-white transition"
                  title="إزالة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {index === coverIndex && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-medium text-white">
                    الغلاف
                  </span>
                )}
              </div>
            ))}

            <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition cursor-pointer">
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-medium">إضافة صور</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/settings/website/projects")}
          >
            إلغاء
          </Button>
          <Button type="submit" loading={creating || uploadingImages}>
            إنشاء المشروع
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;
