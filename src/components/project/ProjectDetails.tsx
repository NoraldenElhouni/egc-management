import React, { useState } from "react";
import {
  useProjectOverview,
  useUpdateProjectOverview,
} from "../../hooks/projects/useProjectOverview";
import { formatDate } from "../../utils/helpper";
import { Calendar, Pin, Pencil, MapPin } from "lucide-react";
import Button from "../ui/Button";
import EditProjectDialog from "./EditProjectDialog";
import { ProjectEditFormValues } from "../../types/schema/projects.schema";

interface Props {
  projectId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "نشط",
    className:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  completed: {
    label: "مكتمل",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  paused: {
    label: "معلق",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
};

const ProjectDetails = ({ projectId }: Props) => {
  const { data, isLoading } = useProjectOverview(projectId);
  const { mutateAsync: updateProject, isPending: isSaving } =
    useUpdateProjectOverview(projectId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleUpdate = async (values: ProjectEditFormValues) => {
    try {
      await updateProject(values);
      setIsEditOpen(false);
    } catch (err) {
      console.error("Error updating project:", err);
      alert("حدث خطأ أثناء تحديث بيانات المشروع.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
        <div className="h-8 bg-muted rounded-lg w-64" />
        <div className="h-4 bg-muted rounded w-40" />
      </div>
    );
  }

  if (!data) return null;

  const status = statusConfig[data.status] ?? statusConfig.active;
  const clientName = [data.client.first_name, data.client.last_name]
    .filter(Boolean)
    .join(" ");
  const { latitude, longitude } = data;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      dir="rtl"
    >
      {/* رأس: الكود + الحالة + زر التعديل */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            {data.code}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
          <Pencil className="w-4 h-4 ml-1.5" />
          تعديل
        </Button>
      </div>

      {/* اسم المشروع */}
      <h1 className="text-2xl font-semibold leading-tight tracking-tight">
        {data.name}
      </h1>

      {data.description && (
        <p className="text-sm text-muted-foreground border-r-2 border-primary/40 pr-3">
          {data.description}
        </p>
      )}

      {/* معلومات المشروع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">العميل</p>
          <p className="font-medium">{clientName}</p>
          {data.client.phone_number && (
            <p className="text-xs text-muted-foreground">
              {data.client.phone_number}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <Pin className="w-3 h-3" /> العنوان
          </p>
          <p className="font-medium">{data.address ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> تاريخ الإنشاء
          </p>
          <p className="font-medium">{formatDate(data.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> الموقع
          </p>
          <p className="font-medium">
            {typeof latitude === "number" && typeof longitude === "number"
              ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              : "—"}
          </p>
        </div>
      </div>

      <EditProjectDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project={data}
        onSubmit={handleUpdate}
        loading={isSaving}
      />
    </div>
  );
};

export default ProjectDetails;
