import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Pencil, Trash } from "lucide-react";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import BackButton from "../../../../components/ui/BackButton";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import SortableList from "../../../../components/operations/boq/SortableList";
import ZoneFormDialog from "../../../../components/operations/boq/ZoneFormDialog";
import {
  Zone,
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useZones,
} from "../../../../hooks/operations/boq/useZones";
import { useReorder } from "../../../../hooks/operations/boq/useReorder";
import { ZoneFormValues } from "../../../../types/schema/boq/zone.schema";

type ZoneDialogState = { mode: "create" } | { mode: "edit"; zone: Zone } | null;

const BOQZonesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { zones, setZones, loading, error, refetch } = useZones(
    projectId ?? "",
  );
  const { createZone, loading: creating } = useCreateZone();
  const { updateZone, loading: updating } = useUpdateZone();
  const { deleteZone, loading: deleting } = useDeleteZone();
  const { reorder } = useReorder("zones");

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

  const handleReorder = (reordered: Zone[]) => {
    reorder(
      reordered,
      (z) => ({
        id: z.id,
        project_id: z.project_id,
        name: z.name,
        sort_order: z.sort_order,
      }),
      setZones,
      refetch,
    );
  };

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

      <SortableList
        items={zones}
        onReorder={handleReorder}
        emptyMessage="لا توجد مناطق بعد"
        renderItem={(zone) => (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
            <span className="font-medium truncate">{zone.name}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(zone.created_at).toLocaleDateString("ar-LY")}
              </span>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-primary"
                aria-label="تعديل المنطقة"
                onClick={() => setDialogState({ mode: "edit", zone })}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-error"
                aria-label="حذف المنطقة"
                onClick={() => setZoneToDelete(zone)}
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
