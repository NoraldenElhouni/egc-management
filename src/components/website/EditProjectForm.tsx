import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import LoadingPage from "../ui/LoadingPage";
import ErrorPage from "../ui/errorPage";
import ProjectFormFields from "./ProjectFormFields";
import { useCategoriesQuery } from "../../hooks/website/useCategories";
import { Project, useProjectQuery, useUpdateProject } from "../../hooks/website/useProjects";
import {
  NewProjectFormValues,
  NewProjectSchema,
  PROJECT_STATUS_OPTIONS,
} from "../../types/schema/website/newProject.schema";

const toFormValues = (project: Project): NewProjectFormValues => ({
  category_id: project.category_id,
  title_ar: project.title_ar,
  title_en: project.title_en,
  slug: project.slug,
  client_ar: project.client_ar ?? "",
  client_en: project.client_en ?? "",
  location_ar: project.location_ar ?? "",
  location_en: project.location_en ?? "",
  status:
    PROJECT_STATUS_OPTIONS.find((o) => o.ar === project.status_ar)?.value ??
    "",
  year: project.year ?? "",
  description_ar: project.description_ar ?? "",
  description_en: project.description_en ?? "",
  is_active: project.is_active,
  is_featured: project.is_featured,
});

type EditProjectFormProps = {
  projectId: string;
};

const EditProjectForm: React.FC<EditProjectFormProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProjectQuery(projectId);
  const { data: categories } = useCategoriesQuery();
  const { mutateAsync: updateProject, isPending } = useUpdateProject();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(NewProjectSchema),
  });

  useEffect(() => {
    if (project) reset(toFormValues(project));
  }, [project, reset]);

  const onSubmit = async (values: NewProjectFormValues) => {
    setSubmitError(null);
    try {
      await updateProject({ id: projectId, values });
      navigate(`/settings/website/projects/${projectId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "فشل في تحديث المشروع",
      );
    }
  };

  if (isLoading) return <LoadingPage label="جاري تحميل المشروع..." />;
  if (error || !project)
    return (
      <ErrorPage
        error={error?.message ?? "المشروع غير موجود"}
        label="خطأ في تحميل المشروع"
      />
    );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        تعديل المشروع
      </h1>

      {submitError && (
        <div className="mb-4 p-3 rounded text-sm bg-error/10 text-error">
          {submitError}
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
        />

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/settings/website/projects/${projectId}`)}
          >
            إلغاء
          </Button>
          <Button type="submit" loading={isPending}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProjectForm;
