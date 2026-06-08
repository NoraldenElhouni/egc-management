import React from "react";
import { useProjectOverview } from "../../hooks/projects/useProjectOverview";
import { formatDate } from "../../utils/helpper";
import { Calendar, Pin } from "lucide-react";

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
  on_hold: {
    label: "معلق",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
};

const ProjectHeader = ({ projectId }: Props) => {
  const { data, isLoading } = useProjectOverview(projectId);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-white/5 rounded-lg w-64 mb-3" />
        <div className="h-4 bg-white/5 rounded w-40" />
      </div>
    );
  }

  if (!data) return null;

  const status = statusConfig[data.status] ?? statusConfig.active;
  const clientName = [data.client.first_name, data.client.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: code + status */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono tracking-widest uppercase">
          {data.code}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Project name */}
      <h1 className="text-3xl font-semibold  leading-tight tracking-tight">
        {data.name}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        {data.address && (
          <span className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" />
            {data.address}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          انشاء في {formatDate(data.created_at)}
        </span>
      </div>

      {/* Client card */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center text-sm font-medium text-gray-700">
          {data.client.first_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">اسم العميل: {clientName}</p>
          <p className="text-xs">
            رقم الهاتف: {data.client.phone_number ?? "غير متوفر "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
