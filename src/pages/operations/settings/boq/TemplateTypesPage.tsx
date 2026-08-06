import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash } from "lucide-react";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import BackButton from "../../../../components/ui/BackButton";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import SortableList from "../../../../components/operations/boq/SortableList";
import TemplateTypeFormDialog from "../../../../components/operations/boq/TemplateTypeFormDialog";
import {
  TemplateType,
  useCreateTemplateType,
  useDeleteTemplateType,
  useTemplateTypes,
  useUpdateTemplateType,
} from "../../../../hooks/operations/boq/useTemplateTypes";
import { useReorder } from "../../../../hooks/operations/boq/useReorder";
import { TemplateTypeFormValues } from "../../../../types/schema/boq/templateType.schema";

type TemplateTypeDialogState =
  | { mode: "create" }
  | { mode: "edit"; templateType: TemplateType }
  | null;

const TemplateTypesPage = () => {
  const { templateTypes, setTemplateTypes, loading, error, refetch } =
    useTemplateTypes();
  const { createTemplateType, loading: creating } = useCreateTemplateType();
  const { updateTemplateType, loading: updating } = useUpdateTemplateType();
  const { deleteTemplateType, loading: deleting } = useDeleteTemplateType();
  const { reorder } = useReorder("template_types");

  const [dialogState, setDialogState] = useState<TemplateTypeDialogState>(null);
  const [templateTypeToDelete, setTemplateTypeToDelete] =
    useState<TemplateType | null>(null);

  if (loading && templateTypes.length === 0) {
    return <LoadingPage label="جاري تحميل قوالب حصر الكميات..." />;
  }
  if (error) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل قوالب حصر الكميات"
        error={error.message}
      />
    );
  }

  const handleSubmit = async (values: TemplateTypeFormValues) => {
    if (!dialogState) return;
    if (dialogState.mode === "create") {
      await createTemplateType(values, templateTypes);
    } else {
      await updateTemplateType(dialogState.templateType.id, values);
    }
    setDialogState(null);
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!templateTypeToDelete) return;
    await deleteTemplateType(templateTypeToDelete.id);
    setTemplateTypeToDelete(null);
    refetch();
  };

  const handleReorder = (reordered: TemplateType[]) => {
    reorder(
      reordered,
      (t) => ({ id: t.id, name: t.name, sort_order: t.sort_order }),
      setTemplateTypes,
      refetch,
    );
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-lg font-bold">قوالب حصر الكميات</h1>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          + نوع قالب جديد
        </Button>
      </div>

      <SortableList
        items={templateTypes}
        onReorder={handleReorder}
        emptyMessage="لا توجد قوالب بعد"
        renderItem={(templateType) => (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <Link
              to={`./${templateType.id}`}
              className="font-bold hover:underline hover:text-blue-600 truncate"
            >
              {templateType.name}
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(templateType.created_at).toLocaleDateString("ar-LY")}
              </span>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-primary"
                aria-label="تعديل النوع"
                onClick={() => setDialogState({ mode: "edit", templateType })}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-error"
                aria-label="حذف النوع"
                onClick={() => setTemplateTypeToDelete(templateType)}
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      />

      <TemplateTypeFormDialog
        isOpen={dialogState !== null}
        onClose={() => setDialogState(null)}
        onSubmit={handleSubmit}
        loading={creating || updating}
        defaultValues={
          dialogState?.mode === "edit"
            ? { name: dialogState.templateType.name }
            : undefined
        }
      />

      <ConfirmDialog
        open={templateTypeToDelete !== null}
        onCancel={() => setTemplateTypeToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        message="سيتم حذف هذا النوع وكل الأعمال والبنود المرتبطة به بشكل نهائي. هل أنت متأكد؟"
        confirmVariant="error"
      />
    </div>
  );
};

export default TemplateTypesPage;
