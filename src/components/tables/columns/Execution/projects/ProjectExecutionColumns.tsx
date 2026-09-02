import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ProjectExecution } from "../../../../../hooks/execution-management/project/useProjects";
import { formatDate } from "../../../../../utils/helpper";
import { statusColor } from "../../../../../utils/colors/status";

export const ProjectExecutionColumns: ColumnDef<ProjectExecution>[] = [
  // Selection column
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          checked={table.getIsAllPageRowsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label={`Select row ${row.index + 1}`}
          onChange={row.getToggleSelectedHandler()}
          checked={row.getIsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    size: 32,
  },

  {
    accessorKey: "name",
    header: "اسم المشروع",
    cell: ({ row }) => (
      <div>
        <Link
          to={`/projects/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "الحالة",
    accessorFn: (row) => row.status,
    cell: ({ row }) => {
      const statusMap: Record<string, string> = {
        active: "نشط",
        paused: "متوقف",
        completed: "مكتمل",
        cancelled: "ملغي",
      };
      const statusColorClass = statusColor(row.original.status);
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}
        >
          {statusMap[row.original.status]}
        </span>
      );
    },
  },

  {
    accessorKey: "start_date",
    header: "تاريخ البدء",
    cell: ({ row }) => {
      const date = row.original.start_date;
      return date ? formatDate(date) : "-";
    },
  },

  {
    accessorKey: "estimated_due_date",
    header: "تاريخ التسليم المتوقع",
    cell: ({ row }) => {
      const date = row.original.estimated_due_date;
      return date ? formatDate(date) : "-";
    },
  },

  {
    accessorKey: "end_date",
    header: "تاريخ الانتهاء",
    cell: ({ row }) => {
      const date = row.original.end_date;
      return date ? formatDate(date) : "-";
    },
  },

  // Edit button — last column
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Link
          to={`/projects/${row.original.id}/edit`}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          تعديل
        </Link>
      </div>
    ),
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];
