import React, { useState } from "react";
import { useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import BOQPDFDialogButton from "../../../../components/operations/boq/BOQPDFDialogButton";
import { useBookProject } from "../../../../hooks/projects/useBookProjects";

import {
  ArticleFull,
  ItemRow,
  WorkFull,
} from "../../../../hooks/operations/boq/types";
import {
  useCreateArticle,
  useDeleteArticle,
  useTypeArticles,
  useUpdateArticle,
} from "../../../../hooks/operations/boq/useArticles";
import {
  useCreateWork,
  useDeleteWork,
  useUpdateWork,
} from "../../../../hooks/operations/boq/useWorks";
import {
  useCreateItem,
  useDeleteItem,
  useUpdateItem,
} from "../../../../hooks/operations/boq/useItems";
import {
  useCreateZone,
  useZones,
} from "../../../../hooks/operations/boq/useZones";
import { useTypes } from "../../../../hooks/operations/boq/useTypes";

import BOQTree from "../../../../components/operations/boq/BOQTree";
import ArticleFormDialog from "../../../../components/operations/boq/ArticleFormDialog";
import WorkFormDialog from "../../../../components/operations/boq/WorkFormDialog";
import ItemFormDialog from "../../../../components/operations/boq/ItemFormDialog";
import ZoneFormDialog from "../../../../components/operations/boq/ZoneFormDialog";
import { ArticleFormValues } from "../../../../types/schema/boq/article.schema";
import { WorkFormValues } from "../../../../types/schema/boq/work.schema";
import { ItemFormValues } from "../../../../types/schema/boq/item.schema";
import { ZoneFormValues } from "../../../../types/schema/boq/zone.schema";

type ArticleDialogState =
  | { mode: "create" }
  | { mode: "edit"; article: ArticleFull }
  | null;

type WorkDialogState =
  | { mode: "create"; article: ArticleFull }
  | { mode: "edit"; work: WorkFull }
  | null;

type ItemDialogState =
  | { mode: "create"; work: WorkFull }
  | { mode: "edit"; work: WorkFull; item: ItemRow }
  | null;

type DeleteState =
  | { kind: "article"; article: ArticleFull }
  | { kind: "work"; work: WorkFull }
  | { kind: "item"; item: ItemRow }
  | null;

const BOQTypeReviewPage = () => {
  const { projectId, typeId } = useParams<{
    projectId: string;
    typeId: string;
  }>();

  const { articles, loading, error, refetch } = useTypeArticles(typeId ?? "");
  const { types } = useTypes(projectId ?? "");
  const { zones, refetch: refetchZones } = useZones(projectId ?? "");
  const { project } = useBookProject(projectId ?? "");

  const { createArticle, loading: savingArticle } = useCreateArticle();
  const { updateArticle } = useUpdateArticle();
  const { deleteArticle, loading: deletingArticle } = useDeleteArticle();

  const { createWork, loading: savingWork } = useCreateWork();
  const { updateWork } = useUpdateWork();
  const { deleteWork, loading: deletingWork } = useDeleteWork();

  const { createItem, loading: savingItem } = useCreateItem();
  const { updateItem } = useUpdateItem();
  const { deleteItem, loading: deletingItem } = useDeleteItem();

  const { createZone, loading: savingZone } = useCreateZone();

  const [articleDialog, setArticleDialog] = useState<ArticleDialogState>(null);
  const [workDialog, setWorkDialog] = useState<WorkDialogState>(null);
  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [pendingWorkForZone, setPendingWorkForZone] = useState<WorkFull | null>(
    null,
  );
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  if (!projectId || !typeId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">لا يوجد مشروع أو نوع محدد</p>
      </div>
    );
  }

  if (loading && articles.length === 0) {
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

  const handleArticleSubmit = async (values: ArticleFormValues) => {
    if (!articleDialog) return;
    if (articleDialog.mode === "create") {
      await createArticle(projectId, typeId, values, articles);
    } else {
      await updateArticle(articleDialog.article.id, values);
    }
    setArticleDialog(null);
    refetch();
  };

  const handleWorkSubmit = async (values: WorkFormValues) => {
    if (!workDialog) return;
    if (workDialog.mode === "create") {
      await createWork(workDialog.article.id, values, workDialog.article.works);
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

  const handleRequestCreateZone = () => {
    if (itemDialog) {
      setPendingWorkForZone(itemDialog.work);
    }
    setItemDialog(null);
    setZoneDialogOpen(true);
  };

  const handleZoneSubmit = async (values: ZoneFormValues) => {
    const { error } = await createZone(projectId, values, zones);
    if (!error) {
      setZoneDialogOpen(false);
      await refetchZones();
      if (pendingWorkForZone) {
        setItemDialog({ mode: "create", work: pendingWorkForZone });
        setPendingWorkForZone(null);
      }
    }
  };

  const deleteMessage = (): string | undefined => {
    if (!deleteState) return undefined;
    switch (deleteState.kind) {
      case "article": {
        const workCount = deleteState.article.works.length;
        const itemCount = deleteState.article.works.reduce(
          (sum, w) => sum + w.items.length,
          0,
        );
        return `سيتم حذف ${workCount} عمل و ${itemCount} بند ضمن هذا الفصل. هل أنت متأكد؟`;
      }
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

    if (deleteState.kind === "article") {
      await deleteArticle(deleteState.article);
      setDeleteState(null);
      refetch();
      return;
    }
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

  const isDeleting = deletingArticle || deletingWork || deletingItem;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">{typeName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {project && currentType && (
            <BOQPDFDialogButton
              project={project}
              currentType={currentType}
              articles={articles}
              zones={zones}
            />
          )}
          <Button size="sm" onClick={() => setArticleDialog({ mode: "create" })}>
            + فصل جديد
          </Button>
        </div>
      </div>

      <BOQTree
        articles={articles}
        zones={zones}
        onEditArticle={(article) => setArticleDialog({ mode: "edit", article })}
        onDeleteArticle={(article) =>
          setDeleteState({ kind: "article", article })
        }
        onAddWork={(article) => setWorkDialog({ mode: "create", article })}
        onEditWork={(work) => setWorkDialog({ mode: "edit", work })}
        onDeleteWork={(work) => setDeleteState({ kind: "work", work })}
        onAddItem={(work) => setItemDialog({ mode: "create", work })}
        onEditItem={(work, item) => setItemDialog({ mode: "edit", work, item })}
        onDeleteItem={(_work, item) => setDeleteState({ kind: "item", item })}
      />

      <ArticleFormDialog
        isOpen={articleDialog !== null}
        onClose={() => setArticleDialog(null)}
        onSubmit={handleArticleSubmit}
        loading={savingArticle}
        defaultValues={
          articleDialog?.mode === "edit"
            ? { name: articleDialog.article.name }
            : undefined
        }
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
        zones={zones}
        onRequestCreateZone={handleRequestCreateZone}
        defaultValues={
          itemDialog?.mode === "edit"
            ? {
                name: itemDialog.item.name,
                unit: itemDialog.item.unit,
                quantity: itemDialog.item.quantity,
                unit_price: itemDialog.item.unit_price,
                zone_id: itemDialog.item.zone_id,
              }
            : undefined
        }
      />

      <ZoneFormDialog
        isOpen={zoneDialogOpen}
        onClose={() => {
          setZoneDialogOpen(false);
          setPendingWorkForZone(null);
        }}
        onSubmit={handleZoneSubmit}
        loading={savingZone}
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
