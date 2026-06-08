import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { employeesWithRole } from "../../hr/list/EmployeesList";
import { roleTranslations } from "../../../utils/translations";

export const EmployeesColumns: ColumnDef<employeesWithRole>[] = [
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
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
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
      const emp = row.original;

      const code = emp.users?.roles?.code;

      return (
        <div>{roleTranslations[code] || emp.users?.roles?.name || "-"}</div>
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
];
