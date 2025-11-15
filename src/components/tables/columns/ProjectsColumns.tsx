import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Projects } from "../../../types/global.type";
import { statusColor } from "../../../utils/colors/status";

export const ProjectsColumns: ColumnDef<Projects>[] = [
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
    header: "الاسم",
    cell: ({ row }) => (
      <Link
        to={`/projects/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },

  {
    accessorKey: "code",
    header: "الكود",
  },

  //   {
  //     accessorKey: "client_id",
  //     header: "العميل",
  //   },

  {
    accessorKey: "percentage",
    header: "نسبة الانجاز",
    cell: ({ row }) => row.original.percentage ?? "—",
  },

  {
    accessorKey: "percentage_taken",
    header: "النسبة المسحوبة",
  },

  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const statusMap: Record<Projects["status"], string> = {
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
    accessorKey: "address",
    header: "العنوان",
    cell: ({ row }) => row.original.address ?? "—",
  },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString("ar-LY");
    },
  },
];
