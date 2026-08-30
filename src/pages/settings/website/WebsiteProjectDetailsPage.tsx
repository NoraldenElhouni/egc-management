import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ImagePlus,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import ProjectImageFormDialog from "../../../components/website/ProjectImageFormDialog";
import ProjectImageAltFormDialog from "../../../components/website/ProjectImageAltFormDialog";
import SortableProjectImageTile from "../../../components/website/SortableProjectImageTile";
import DeleteProjectDialog from "../../../components/website/DeleteProjectDialog";
import { useProjectQuery, useDeleteProject } from "../../../hooks/website/useProjects";
import {
  ProjectImage,
  useCreateProjectImage,
  useDeleteProjectImage,
  useProjectImagesQuery,
  useReorderProjectImages,
  useSetCoverProjectImage,
  useUpdateProjectImageAlt,
  withImageSortOrder,
} from "../../../hooks/website/useProjectImages";
import {
  ProjectImageAltFormValues,
  ProjectImageFormValues,
} from "../../../types/schema/website/projectImage.schema";

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) =>
  value ? (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 mt-0.5">{value}</div>
    </div>
  ) : null;

const WebsiteProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, error } = useProjectQuery(id ?? "");
  const { data: images } = useProjectImagesQuery(id ?? "");
  const { mutateAsync: createImage, isPending: creatingImage } =
    useCreateProjectImage(id ?? "");
  const { mutateAsync: updateImageAlt, isPending: updatingAlt } =
    useUpdateProjectImageAlt(id ?? "");
  const { mutateAsync: deleteImage, isPending: deletingImage } =
    useDeleteProjectImage(id ?? "");
  const { mutate: reorderImages } = useReorderProjectImages(id ?? "");
  const { mutate: setCoverImage } = useSetCoverProjectImage(id ?? "");
  const { mutateAsync: deleteProject, isPending: deletingProject } =
    useDeleteProject();

  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editImageTarget, setEditImageTarget] = useState<ProjectImage | null>(
    null,
  );
  const [deleteImageTarget, setDeleteImageTarget] =
    useState<ProjectImage | null>(null);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleAddImage = async (values: ProjectImageFormValues) => {
    if (!project) return;
    await createImage({ slug: project.slug, values });
    setIsImageDialogOpen(false);
  };

  const handleUpdateImageAlt = async (values: ProjectImageAltFormValues) => {
    if (!editImageTarget) return;
    await updateImageAlt({ id: editImageTarget.id, values });
    setEditImageTarget(null);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteImageTarget) return;
    await deleteImage(deleteImageTarget);
    setDeleteImageTarget(null);
  };

  const handleSetCover = (image: ProjectImage) => {
    if (image.is_cover) return;
    setCoverImage(image.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!images) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderImages(withImageSortOrder(arrayMove(images, oldIndex, newIndex)));
  };

  const handleConfirmDeleteProject = async () => {
    if (!project) return;
    await deleteProject(project);
    navigate("/settings/website/projects");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link
          to="/settings/website/projects"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowRight className="w-4 h-4" />
          الرجوع إلى المشاريع
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project.title_ar}
                </h1>
                <p className="text-sm text-gray-500">{project.title_en}</p>
              </div>
            </div>

            <Link to={`/settings/website/projects/${project.id}/edit`}>
              <Button size="sm" variant="primary-outline" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                تعديل
              </Button>
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.categories?.name_ar && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {project.categories.name_ar}
              </span>
            )}
            {project.status_ar && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                {project.status_ar}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                project.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {project.is_active ? "مفعّل" : "غير مفعّل"}
            </span>
            {project.is_featured && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                مميز
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="السنة" value={project.year} />
            <InfoField label="العميل (عربي)" value={project.client_ar} />
            <InfoField label="العميل (إنجليزي)" value={project.client_en} />
            <InfoField label="الموقع (عربي)" value={project.location_ar} />
            <InfoField label="الموقع (إنجليزي)" value={project.location_en} />
          </div>

          {(project.description_ar || project.description_en) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="الوصف (عربي)"
                value={project.description_ar}
              />
              <InfoField
                label="الوصف (إنجليزي)"
                value={project.description_en}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">الصور</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                اسحب الصور لإعادة ترتيبها
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setIsImageDialogOpen(true)}
              className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">إضافة صورة</span>
            </button>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(images ?? []).map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                {(images ?? []).map((image) => (
                  <SortableProjectImageTile
                    key={image.id}
                    image={image}
                    onEdit={setEditImageTarget}
                    onDelete={setDeleteImageTarget}
                    onSetCover={handleSetCover}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-error mb-1">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-sm font-semibold">منطقة الخطر</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            حذف المشروع نهائيًا مع جميع صوره. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <Button
            type="button"
            variant="error"
            size="sm"
            onClick={() => setIsDeleteProjectOpen(true)}
          >
            حذف المشروع
          </Button>
        </div>
      </div>

      <ProjectImageFormDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onSubmit={handleAddImage}
        loading={creatingImage}
      />

      {editImageTarget && (
        <ProjectImageAltFormDialog
          isOpen={editImageTarget !== null}
          onClose={() => setEditImageTarget(null)}
          onSubmit={handleUpdateImageAlt}
          defaultValues={{
            alt_ar: editImageTarget.alt_ar,
            alt_en: editImageTarget.alt_en,
          }}
          loading={updatingAlt}
        />
      )}

      <ConfirmDialog
        open={deleteImageTarget !== null}
        title="حذف الصورة"
        message={
          deleteImageTarget
            ? `هل أنت متأكد من حذف "${deleteImageTarget.alt_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmVariant="error"
        loading={deletingImage}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setDeleteImageTarget(null)}
      />

      <DeleteProjectDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleConfirmDeleteProject}
        projectTitle={project.title_ar}
        loading={deletingProject}
      />
    </div>
  );
};

export default WebsiteProjectDetailsPage;
