import { ColumnDef } from "@tanstack/react-table";
import { LogEntry } from "../../../hooks/logs/useLogs";

const statusColor = (status: number) => {
  if (status >= 500) return "text-red-600";
  if (status >= 400) return "text-amber-600";
  if (status >= 300) return "text-blue-600";
  return "text-green-600";
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
      <span className={`font-semibold ${statusColor(row.original.status_code)}`}>
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
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];
