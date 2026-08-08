import { ColumnDef } from "@tanstack/react-table";
import { LogEntry } from "../../../hooks/logs/useLogs";
import { formatDate } from "../../../utils/helpper";

const statusColor = (status: number) => {
  if (status >= 500) return "text-red-600";
  if (status >= 400) return "text-amber-600";
  if (status >= 300) return "text-blue-600";
  return "text-green-600";
};

// requester_name is sent percent-encoded (it may contain Arabic/Unicode); decode for display.
const decodeRequesterName = (name: string) => {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

export const LogsColumns: ColumnDef<LogEntry>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "path",
    header: "Path",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.path}</span>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
  },
  {
    accessorKey: "status_code",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`font-semibold ${statusColor(row.original.status_code)}`}
      >
        {row.original.status_code}
      </span>
    ),
  },
  {
    accessorKey: "duration_ms",
    header: "Duration (ms)",
    cell: ({ row }) => row.original.duration_ms.toLocaleString(),
  },
  {
    accessorKey: "system_name",
    header: "System",
  },
  {
    accessorKey: "requester_name",
    header: "Requester",
    cell: ({ row }) => decodeRequesterName(row.original.requester_name),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
];
