import { ColumnDef } from "@tanstack/react-table";
import { Roles } from "../../../types/global.type";
import { Link } from "react-router-dom";
import { Ellipsis } from "lucide-react";

export const RoleColumns: ColumnDef<Roles>[] = [
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
          to={`/settings/roles/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "code",
    header: "الرمز",
  },
  {
    accessorKey: "number",
    header: "العدد الموظفين",
  },

  //actions
  {
    id: "actions",
    accessorKey: "actions",
    header: "الإجراءات",
    cell: () => (
      <div>
        <Ellipsis />
      </div>
    ),
  },
];
