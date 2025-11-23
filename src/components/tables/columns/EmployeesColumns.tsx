import { ColumnDef } from "@tanstack/react-table";
import { EmployeeWithRole } from "../../../types/extended.type";
import { Link } from "react-router-dom";

export const EmployeesColumns: ColumnDef<EmployeeWithRole>[] = [
  // Selection column (first column)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          // toggle all visible (page) rows
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
    // keep this column narrow
    size: 32,
  },

  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => (
      <div>
        <Link
          to={`/hr/employees/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.first_name} {row.original.last_name}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
  },

  {
    accessorKey: "role",
    header: "الدور",
    cell: ({ row }) => {
      const roleName = row.original.users?.roles?.name;
      return (
        <span className="text-sm">
          {roleName || "غير محدد"}
        </span>
      );
    },
  },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString("ar-LY");
    },
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.original.status === "Active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.status === "Active" ? "نشط" : "غير نشط"}
      </span>
    ),
  },
];
