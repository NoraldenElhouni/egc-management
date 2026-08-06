import React, { useState } from "react";
import { useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import BOQPDFDialogButton from "../../../../components/operations/boq/BOQPDFDialogButton";
import { useBookProject } from "../../../../hooks/projects/useBookProjects";

import { ItemRow, WorkFull } from "../../../../hooks/operations/boq/types";
import {
  useCreateWork,
  useDeleteWork,
  useTypeWorks,
  useUpdateWork,
} from "../../../../hooks/operations/boq/useWorks";
import {
  useCreateItem,
  useDeleteItem,
  useUpdateItem,
} from "../../../../hooks/operations/boq/useItems";
import { useZones, Zone } from "../../../../hooks/operations/boq/useZones";
import { useTypes } from "../../../../hooks/operations/boq/useTypes";

import BOQTree from "../../../../components/operations/boq/BOQTree";
import WorkFormDialog from "../../../../components/operations/boq/WorkFormDialog";
import ItemFormDialog from "../../../../components/operations/boq/ItemFormDialog";
import { WorkFormValues } from "../../../../types/schema/boq/work.schema";
import { ItemFormValues } from "../../../../types/schema/boq/item.schema";

type WorkDialogState =
  | { mode: "create"; zone: Zone }
  | { mode: "edit"; work: WorkFull }
  | null;

type ItemDialogState =
  | { mode: "create"; work: WorkFull }
  | { mode: "edit"; work: WorkFull; item: ItemRow }
  | null;

type DeleteState =
  | { kind: "work"; work: WorkFull }
  | { kind: "item"; work: WorkFull; item: ItemRow }
  | null;

const BOQTypeReviewPage = () => {
  const { projectId, typeId } = useParams<{
    projectId: string;
    typeId: string;
  }>();

  const { works, loading, error, refetch } = useTypeWorks(typeId ?? "");
  const { types } = useTypes(projectId ?? "");
  const { zones } = useZones(projectId ?? "");
  const { project } = useBookProject(projectId ?? "");

  const { createWork, loading: savingWork } = useCreateWork();
  const { updateWork } = useUpdateWork();
  const { deleteWork, loading: deletingWork } = useDeleteWork();

  const { createItem, loading: savingItem } = useCreateItem();
  const { updateItem } = useUpdateItem();
  const { deleteItem, loading: deletingItem } = useDeleteItem();

  const [workDialog, setWorkDialog] = useState<WorkDialogState>(null);
  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  if (!projectId || !typeId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">لا يوجد مشروع أو نوع محدد</p>
      </div>
    );
  }

  if (loading && works.length === 0) {
    return <LoadingPage label="جاري تحميل جدول الكميات..." />;
  }
  if (error) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل جدول الكميات"
        error={error.message}
      />
    );
  }

  const currentType = types.find((t) => t.id === typeId);
  const typeName = currentType?.name ?? "";

  const handleWorkSubmit = async (values: WorkFormValues) => {
    if (!workDialog) return;
    if (workDialog.mode === "create") {
      const siblings = works.filter((w) => w.zone_id === workDialog.zone.id);
      await createWork(typeId, workDialog.zone.id, values, siblings);
    } else {
      await updateWork(workDialog.work.id, values);
    }
    setWorkDialog(null);
    refetch();
  };

  const handleItemSubmit = async (values: ItemFormValues) => {
    if (!itemDialog) return;
    if (itemDialog.mode === "create") {
      await createItem(itemDialog.work.id, values, itemDialog.work.items);
    } else {
      await updateItem(itemDialog.item.id, values);
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
      await deleteWork(deleteState.work);
      setDeleteState(null);
      refetch();
      return;
    }
    if (deleteState.kind === "item") {
      await deleteItem(deleteState.item.id);
      setDeleteState(null);
      refetch();
      return;
    }
  };

  const isDeleting = deletingWork || deletingItem;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">
            {typeName} — v{currentType?.version ?? 0}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {project && currentType && (
            <BOQPDFDialogButton
              project={project}
              currentType={currentType}
              allTypes={types}
              works={works}
              zones={zones}
            />
          )}
        </div>
      </div>

      <BOQTree
        zones={zones}
        works={works}
        onAddWork={(zone) => setWorkDialog({ mode: "create", zone })}
        onEditWork={(work) => setWorkDialog({ mode: "edit", work })}
        onDeleteWork={(work) => setDeleteState({ kind: "work", work })}
        onAddItem={(work) => setItemDialog({ mode: "create", work })}
        onEditItem={(work, item) => setItemDialog({ mode: "edit", work, item })}
        onDeleteItem={(work, item) => setDeleteState({ kind: "item", work, item })}
      />

      <WorkFormDialog
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

      <ItemFormDialog
        isOpen={itemDialog !== null}
        onClose={() => setItemDialog(null)}
        onSubmit={handleItemSubmit}
        loading={savingItem}
        defaultValues={
          itemDialog?.mode === "edit"
            ? {
                name: itemDialog.item.name,
                unit: itemDialog.item.unit,
                quantity: itemDialog.item.quantity,
                unit_price: itemDialog.item.unit_price,
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

export default BOQTypeReviewPage;
