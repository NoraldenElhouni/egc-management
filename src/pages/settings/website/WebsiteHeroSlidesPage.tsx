import { useState } from "react";
import { GalleryHorizontal, Plus } from "lucide-react";
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
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import HeroSlideFormDialog from "../../../components/website/HeroSlideFormDialog";
import HeroSlideAltFormDialog from "../../../components/website/HeroSlideAltFormDialog";
import SortableHeroSlideTile from "../../../components/website/SortableHeroSlideTile";
import {
  HeroSlide,
  useCreateHeroSlide,
  useDeleteHeroSlide,
  useHeroSlidesQuery,
  useReorderHeroSlides,
  useUpdateHeroSlideAlt,
  withSortOrder,
} from "../../../hooks/website/useHeroSlides";
import {
  HeroSlideAltFormValues,
  HeroSlideFormValues,
} from "../../../types/schema/website/heroSlide.schema";

const WebsiteHeroSlidesPage = () => {
  const { data: slides, isLoading, error } = useHeroSlidesQuery();
  const { mutateAsync: createHeroSlide, isPending: creating } =
    useCreateHeroSlide();
  const { mutateAsync: deleteHeroSlide, isPending: deleting } =
    useDeleteHeroSlide();
  const { mutate: reorderHeroSlides } = useReorderHeroSlides();
  const { mutateAsync: updateHeroSlideAlt, isPending: updatingAlt } =
    useUpdateHeroSlideAlt();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleCreate = async (values: HeroSlideFormValues) => {
    await createHeroSlide(values);
    setIsDialogOpen(false);
  };

  const handleUpdateAlt = async (values: HeroSlideAltFormValues) => {
    if (!editTarget) return;
    await updateHeroSlideAlt({ id: editTarget.id, values });
    setEditTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteHeroSlide(deleteTarget);
    setDeleteTarget(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!slides) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderHeroSlides(withSortOrder(arrayMove(slides, oldIndex, newIndex)));
  };

  if (isLoading) return <LoadingPage label="جاري تحميل الشرائح..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل الشرائح" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <GalleryHorizontal className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                الشرائح الرئيسية
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                إدارة صور شرائح الصفحة الرئيسية للموقع — اسحب الصور لإعادة
                ترتيبها
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="aspect-[16/9] rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">إضافة صورة</span>
          </button>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={(slides ?? []).map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              {(slides ?? []).map((slide) => (
                <SortableHeroSlideTile
                  key={slide.id}
                  slide={slide}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {(!slides || slides.length === 0) && (
          <p className="text-center text-sm text-gray-500">
            لا توجد شرائح بعد — ابدأ بإضافة صورة جديدة
          </p>
        )}
      </div>

      <HeroSlideFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
      />

      {editTarget && (
        <HeroSlideAltFormDialog
          isOpen={editTarget !== null}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdateAlt}
          defaultValues={{
            alt_ar: editTarget.alt_ar,
            alt_en: editTarget.alt_en,
          }}
          loading={updatingAlt}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف الشريحة"
        message={
          deleteTarget
            ? `هل أنت متأكد من حذف "${deleteTarget.alt_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : ""
        }
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmVariant="error"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default WebsiteHeroSlidesPage;
