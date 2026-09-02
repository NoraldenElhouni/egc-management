// =====================================================================
// DEPRECATED — PHASE 4. Do not use, do not re-wire.
// =====================================================================
// Replaced by src/components/project/team/TeamRoster.tsx, which groups
// members by project role and renders everyone in a group identically.
//
// Two reasons this one cannot be reused as-is: it has a "النسبة"
// (percentage) column, which must not appear on the team screen at all
// (guide section 4.5), and a flat sortable table cannot express "these
// three Project Managers are equals" as clearly as a grouped list.
//
// Retired in Phase 8 with the rest of the old team path.
// =====================================================================

import { ColumnDef } from "@tanstack/react-table";
import { TeamEmployee } from "../../../types/team.type";
import { Link } from "react-router-dom";

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
  {
    id: "action",
    header: "إجراء",
    cell: ({ row }) => (
      <Link
        to={`/projects/team/${row.original.project_id}/${row.original.id}/permissions`}
        className="hover:underline"
      >
        التصاريح
      </Link>
    ),
  },
];
