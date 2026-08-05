import React, { useState } from "react";
import { useParams } from "react-router-dom";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import BackButton from "../../../../components/ui/BackButton";
import Button from "../../../../components/ui/Button";
import GenericTable from "../../../../components/tables/table";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import ZoneFormDialog from "../../../../components/operations/boq/ZoneFormDialog";
import { getZoneColumns } from "../../../../components/tables/columns/operations/boq/ZoneColumns";
import {
  Zone,
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useZones,
} from "../../../../hooks/operations/boq/useZones";
import { ZoneFormValues } from "../../../../types/schema/boq/zone.schema";

type ZoneDialogState = { mode: "create" } | { mode: "edit"; zone: Zone } | null;

const BOQZonesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { zones, loading, error, refetch } = useZones(projectId ?? "");
  const { createZone, loading: creating } = useCreateZone();
  const { updateZone, loading: updating } = useUpdateZone();
  const { deleteZone, loading: deleting } = useDeleteZone();

  const [dialogState, setDialogState] = useState<ZoneDialogState>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project Id found</p>
      </div>
    );
  }

  if (loading && zones.length === 0) {
    return <LoadingPage label="جاري تحميل المناطق..." />;
  }
  if (error) {
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل المناطق" error={error.message} />
    );
  }

  const handleSubmit = async (values: ZoneFormValues) => {
    if (!dialogState) return;
    if (dialogState.mode === "create") {
      await createZone(projectId, values, zones);
    } else {
      await updateZone(dialogState.zone.id, values);
    }
    setDialogState(null);
    refetch();
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;
    const result = await deleteZone(zoneToDelete.id);
    setZoneToDelete(null);
    if (result.blocked) {
      alert(result.message);
      return;
    }
    refetch();
  };

  const columns = getZoneColumns({
    onEdit: (zone) => setDialogState({ mode: "edit", zone }),
    onDelete: (zone) => setZoneToDelete(zone),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-lg font-bold">مناطق المشروع</h1>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          + منطقة جديدة
        </Button>
      </div>

      <GenericTable
        data={zones}
        columns={columns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />

      <ZoneFormDialog
        isOpen={dialogState !== null}
        onClose={() => setDialogState(null)}
        onSubmit={handleSubmit}
        loading={creating || updating}
        defaultValues={
          dialogState?.mode === "edit" ? { name: dialogState.zone.name } : undefined
        }
      />

      <ConfirmDialog
        open={zoneToDelete !== null}
        onCancel={() => setZoneToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        message="هل تريد حذف هذه المنطقة؟"
        confirmVariant="error"
      />
    </div>
  );
};

export default BOQZonesPage;
