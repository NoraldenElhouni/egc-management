import React, { useState } from "react";
import { useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import BackButton from "../../../../components/ui/BackButton";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";

import {
  TemplateItemRow,
  TemplateWorkFull,
} from "../../../../hooks/operations/boq/types";
import {
  useCreateTemplateWork,
  useDeleteTemplateWork,
  useTemplateTypeWorks,
  useUpdateTemplateWork,
} from "../../../../hooks/operations/boq/useTemplateWorks";
import {
  useCreateTemplateItem,
  useDeleteTemplateItem,
  useUpdateTemplateItem,
} from "../../../../hooks/operations/boq/useTemplateItems";
import { useTemplateTypes } from "../../../../hooks/operations/boq/useTemplateTypes";
import { useReorder } from "../../../../hooks/operations/boq/useReorder";

import TemplateTree from "../../../../components/operations/boq/TemplateTree";
import TemplateWorkFormDialog from "../../../../components/operations/boq/TemplateWorkFormDialog";
import TemplateItemFormDialog from "../../../../components/operations/boq/TemplateItemFormDialog";
import { TemplateWorkFormValues } from "../../../../types/schema/boq/templateWork.schema";
import { TemplateItemFormValues } from "../../../../types/schema/boq/templateItem.schema";

type WorkDialogState =
  | { mode: "create" }
  | { mode: "edit"; work: TemplateWorkFull }
  | null;

type ItemDialogState =
  | { mode: "create"; work: TemplateWorkFull }
  | { mode: "edit"; work: TemplateWorkFull; item: TemplateItemRow }
  | null;

type DeleteState =
  | { kind: "work"; work: TemplateWorkFull }
  | { kind: "item"; work: TemplateWorkFull; item: TemplateItemRow }
  | null;

const TemplateTypeDetailPage = () => {
  const { templateTypeId } = useParams<{ templateTypeId: string }>();

  const { works, setWorks, loading, error, refetch } = useTemplateTypeWorks(
    templateTypeId ?? "",
  );
  const { templateTypes } = useTemplateTypes();

  const { createTemplateWork, loading: savingWork } = useCreateTemplateWork();
  const { updateTemplateWork } = useUpdateTemplateWork();
  const { deleteTemplateWork, loading: deletingWork } = useDeleteTemplateWork();
  const { reorder: reorderWorks } = useReorder("template_works");

  const { createTemplateItem, loading: savingItem } = useCreateTemplateItem();
  const { updateTemplateItem } = useUpdateTemplateItem();
  const { deleteTemplateItem, loading: deletingItem } = useDeleteTemplateItem();
  const { reorder: reorderItems } = useReorder("template_items");

  const [workDialog, setWorkDialog] = useState<WorkDialogState>(null);
  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  if (!templateTypeId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">لا يوجد نوع قالب محدد</p>
      </div>
    );
  }

  if (loading && works.length === 0) {
    return <LoadingPage label="جاري تحميل عناصر القالب..." />;
  }
  if (error) {
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل عناصر القالب" error={error.message} />
    );
  }

  const currentTemplateType = templateTypes.find(
    (t) => t.id === templateTypeId,
  );
  const typeName = currentTemplateType?.name ?? "";

  const handleWorkSubmit = async (values: TemplateWorkFormValues) => {
    if (!workDialog) return;
    if (workDialog.mode === "create") {
      await createTemplateWork(templateTypeId, values, works);
    } else {
      await updateTemplateWork(workDialog.work.id, values);
    }
    setWorkDialog(null);
    refetch();
  };

  const handleItemSubmit = async (values: TemplateItemFormValues) => {
    if (!itemDialog) return;
    if (itemDialog.mode === "create") {
      await createTemplateItem(itemDialog.work.id, values, itemDialog.work.items);
    } else {
      await updateTemplateItem(itemDialog.item.id, values);
    }
    setItemDialog(null);
    refetch();
  };

  const deleteMessage = (): string | undefined => {
    if (!deleteState) return undefined;
    switch (deleteState.kind) {
      case "work": {
        const itemCount = deleteState.work.items.length;
        return `سيتم حذف ${itemCount} بند ضمن هذا العمل. هل أنت متأكد؟`;
      }
      case "item":
        return "هل تريد حذف هذا البند؟";
      default:
        return undefined;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteState) return;

    if (deleteState.kind === "work") {
      await deleteTemplateWork(deleteState.work);
      setDeleteState(null);
      refetch();
      return;
    }
    if (deleteState.kind === "item") {
      await deleteTemplateItem(deleteState.item.id);
      setDeleteState(null);
      refetch();
      return;
    }
  };

  const handleReorderWorks = (reordered: TemplateWorkFull[]) => {
    reorderWorks(
      reordered,
      (w) => ({
        id: w.id,
        template_type_id: w.template_type_id,
        name: w.name,
        sort_order: w.sort_order,
      }),
      setWorks,
      refetch,
    );
  };

  const handleReorderItems = (
    work: TemplateWorkFull,
    reordered: TemplateItemRow[],
  ) => {
    reorderItems(
      reordered,
      (i) => ({
        id: i.id,
        template_work_id: work.id,
        name: i.name,
        unit: i.unit,
        sort_order: i.sort_order,
      }),
      (withNewOrder) => {
        setWorks((prev) =>
          prev.map((w) =>
            w.id === work.id
              ? { ...w, items: withNewOrder }
              : w,
          ),
        );
      },
      refetch,
    );
  };

  const isDeleting = deletingWork || deletingItem;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-lg font-bold">{typeName}</h1>
        </div>
        <Button size="sm" onClick={() => setWorkDialog({ mode: "create" })}>
          + عمل جديد
        </Button>
      </div>

      <TemplateTree
        works={works}
        onEditWork={(work) => setWorkDialog({ mode: "edit", work })}
        onDeleteWork={(work) => setDeleteState({ kind: "work", work })}
        onReorderWorks={handleReorderWorks}
        onAddItem={(work) => setItemDialog({ mode: "create", work })}
        onEditItem={(work, item) => setItemDialog({ mode: "edit", work, item })}
        onDeleteItem={(work, item) => setDeleteState({ kind: "item", work, item })}
        onReorderItems={handleReorderItems}
      />

      <TemplateWorkFormDialog
        isOpen={workDialog !== null}
        onClose={() => setWorkDialog(null)}
        onSubmit={handleWorkSubmit}
        loading={savingWork}
        defaultValues={
          workDialog?.mode === "edit"
            ? { name: workDialog.work.name }
            : undefined
        }
      />

      <TemplateItemFormDialog
        isOpen={itemDialog !== null}
        onClose={() => setItemDialog(null)}
        onSubmit={handleItemSubmit}
        loading={savingItem}
        defaultValues={
          itemDialog?.mode === "edit"
            ? {
                name: itemDialog.item.name,
                unit: itemDialog.item.unit,
                default_quantity: itemDialog.item.default_quantity,
                default_unit_price: itemDialog.item.default_unit_price,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteState !== null}
        onCancel={() => setDeleteState(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        message={deleteMessage()}
        confirmVariant="error"
      />
    </div>
  );
};

export default TemplateTypeDetailPage;
