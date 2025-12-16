import { ColumnDef } from "@tanstack/react-table";
import { TeamEmployee } from "../../../types/team.type";

export const TeamEmployeesColumns: ColumnDef<TeamEmployee>[] = [
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
    id: "name",
    header: "الاسم",
    accessorFn: (row) => `${row.first_name || ""} ${row.last_name || ""}`,
    cell: (info) => info.getValue() as string,
  },
  {
    id: "role",
    header: "الدور",
    accessorKey: "role",
    cell: (info) => info.getValue() ?? "-",
  },
  {
    id: "percentage",
    header: "النسبة",
    accessorKey: "percentage",
    cell: (info) => {
      const val = info.getValue() as number | null | undefined;
      if (val === null || val === undefined) return "-";
      return `${Number(val).toFixed(2)}%`;
    },
  },
  {
    id: "email",
    header: "البريد الإلكتروني",
    accessorKey: "email",
    cell: (info) => info.getValue() ?? "-",
  },
];
