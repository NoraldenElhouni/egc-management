import React from "react";
import { useProjectOverview } from "../../hooks/projects/useProjectOverview";

interface Props {
  projectId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
  cancelled: {
    label: "Cancelled",
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

  const formattedDate = new Date(data.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 21C16.4183 9 20 6.41828 20 12C20 17.5228 16.4183 21 12 21Z" />
              <path d="M12 21C7.58172 21 4 17.5228 4 12C4 6.41828 7.58172 9 12 21Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {data.address}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Started {formattedDate}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/[0.06] mt-1" />

      {/* Client card */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">
          {data.client.first_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{clientName}</p>
          <p className="text-xs">{data.client.phone_number}</p>
        </div>
        <span className="ml-auto text-xs italic">العميل</span>
      </div>
    </div>
  );
};

export default ProjectHeader;
