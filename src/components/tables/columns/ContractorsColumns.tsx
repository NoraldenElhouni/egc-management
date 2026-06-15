import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { contractorWithSpecializations } from "../../../types/extended.type";

export const ContractorsColumns: ColumnDef<contractorWithSpecializations>[] = [
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
    size: 32,
  },

  {
    accessorKey: "name",
    header: "الاسم",
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    cell: ({ row }) => (
      <div>
        <Link
          to={`/supply-chain/contractors/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.first_name} {row.original.last_name}
        </Link>
      </div>
    ),
  },

  {
    id: "specializations",
    header: "التخصصات",
    accessorFn: (row) =>
      row.users?.user_specializations
        ?.map((us) => us.specializations?.name)
        .filter(Boolean)
        .join(", ") ?? "",
    cell: ({ row }) => {
      const specializations =
        row.original.users?.user_specializations
          ?.map((us) => us.specializations?.name)
          .filter(Boolean) ?? [];

      return (
        <div className="flex flex-wrap gap-1">
          {specializations.length > 0 ? (
            specializations.map((name) => (
              <span
                key={name}
                className="px-2 py-1 text-xs bg-gray-100 rounded"
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-gray-400">لا يوجد</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
  },
  {
    accessorKey: "phone_number",
    header: "رقم الهاتف",
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
