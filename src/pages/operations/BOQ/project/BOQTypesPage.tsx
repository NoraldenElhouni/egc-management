import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import Button from "../../../../components/ui/Button";
import GenericTable from "../../../../components/tables/table";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import TypeFormDialog from "../../../../components/operations/boq/TypeFormDialog";
import { getTypeColumns } from "../../../../components/tables/columns/operations/boq/TypeColumns";
import {
  BOQType,
  useCreateType,
  useDeleteType,
  useTypes,
  useUpdateType,
} from "../../../../hooks/operations/boq/useTypes";
import { TypeFormValues } from "../../../../types/schema/boq/type.schema";

type TypeDialogState = { mode: "create" } | { mode: "edit"; type: BOQType } | null;

const BOQTypesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { types, loading, error, refetch } = useTypes(projectId ?? "");
  const { createType, loading: creating } = useCreateType();
  const { updateType, loading: updating } = useUpdateType();
  const { deleteType, loading: deleting } = useDeleteType();

  const [dialogState, setDialogState] = useState<TypeDialogState>(null);
  const [typeToDelete, setTypeToDelete] = useState<BOQType | null>(null);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project Id found</p>
      </div>
    );
  }

  if (loading && types.length === 0) {
    return <LoadingPage label="جاري تحميل جداول الكميات..." />;
  }
  if (error) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل جداول الكميات"
        error={error.message}
      />
    );
  }

  const handleSubmit = async (values: TypeFormValues) => {
    if (!dialogState) return;
    if (dialogState.mode === "create") {
      await createType(projectId, values, types);
    } else {
      await updateType(dialogState.type.id, values);
    }
    setDialogState(null);
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    await deleteType(typeToDelete.id);
    setTypeToDelete(null);
    refetch();
  };

  const columns = getTypeColumns({
    onEdit: (type) => setDialogState({ mode: "edit", type }),
    onDelete: (type) => setTypeToDelete(type),
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">جداول الكميات</h1>
        <div className="flex items-center gap-2">
          <Link to={`/operations/boq/project/${projectId}/zones`}>
            <Button variant="secondary">إدارة المناطق</Button>
          </Link>
          <Button onClick={() => setDialogState({ mode: "create" })}>
            + نوع جديد
          </Button>
        </div>
      </div>

      <GenericTable
        data={types}
        columns={columns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />

      <TypeFormDialog
        isOpen={dialogState !== null}
        onClose={() => setDialogState(null)}
        onSubmit={handleSubmit}
        loading={creating || updating}
        defaultValues={
          dialogState?.mode === "edit" ? { name: dialogState.type.name } : undefined
        }
      />

      <ConfirmDialog
        open={typeToDelete !== null}
        onCancel={() => setTypeToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        message="سيتم حذف هذا النوع وكل الفصول والأعمال والبنود المرتبطة به بشكل نهائي. هل أنت متأكد؟"
        confirmVariant="error"
      />
    </div>
  );
};

export default BOQTypesPage;
