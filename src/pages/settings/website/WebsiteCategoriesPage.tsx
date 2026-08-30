import { useState } from "react";
import { Tags, Plus, Trash2 } from "lucide-react";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import CategoryFormDialog from "../../../components/website/CategoryFormDialog";
import {
  Category,
  useCategoriesQuery,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategoryActive,
} from "../../../hooks/website/useCategories";
import { CategoryFormValues } from "../../../types/schema/website/category.schema";

const WebsiteCategoriesPage = () => {
  const { data: categories, isLoading, error } = useCategoriesQuery();
  const { mutateAsync: createCategory, isPending: creating } =
    useCreateCategory();
  const { mutate: updateCategoryActive, isPending: updatingActive } =
    useUpdateCategoryActive();
  const { mutateAsync: deleteCategory, isPending: deleting } =
    useDeleteCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleCreate = async (values: CategoryFormValues) => {
    await createCategory(values);
    setIsDialogOpen(false);
  };

  const handleToggleActive = (category: Category) => {
    updateCategoryActive({ id: category.id, is_active: !category.is_active });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <LoadingPage label="جاري تحميل التصنيفات..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل التصنيفات" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Tags className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                التصنيفات
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                إدارة تصنيفات المشاريع المعروضة في الموقع
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            تصنيف جديد
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {!categories || categories.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                لا توجد تصنيفات
              </p>
              <p className="text-xs text-gray-500 mt-1">
                جرّب إضافة تصنيف جديد من الأعلى
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Tags className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {category.name_ar}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {category.name_en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(category)}
                      disabled={updatingActive}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${
                        category.is_active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {category.is_active ? "مفعّل" : "غير مفعّل"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CategoryFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف التصنيف"
        message={
          deleteTarget
            ? `هل أنت متأكد من حذف "${deleteTarget.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`
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

export default WebsiteCategoriesPage;
