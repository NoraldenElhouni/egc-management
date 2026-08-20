import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { VendorsWithSpecializations } from "../../../types/extended.type";

export const VendorsColumns: ColumnDef<VendorsWithSpecializations>[] = [
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
    accessorKey: "vendor_name",
    header: "اسم المورد",
    cell: ({ row }) => (
      <Link
        to={`/supply-chain/vendors/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.vendor_name}
      </Link>
    ),
  },

  {
    id: "specializations",
    header: "التخصصات",
    accessorFn: (row) =>
      row.users?.user_specializations
        ?.map((us) => us.specializations?.name)
        .filter(Boolean)
        .join(", ") ||
      row.specializations?.name ||
      "",
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
          ) : row.original.specializations ? (
            <span className="px-2 py-1 text-xs bg-gray-100 rounded">
              {row.original.specializations.name}
            </span>
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
    accessorKey: "alt_phone_number",
    header: "رقم هاتف البديل",
    cell: ({ row }) =>
      row.original.alt_phone_number ? (
        row.original.alt_phone_number
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },

  {
    id: "bank_account_approved",
    header: "معتمد بنكياً",
    accessorFn: (row) =>
      row.bank_account_approved ? "approved" : "not_approved",
    cell: ({ row }) => (
      <span
        title={row.original.bank_account_approved ? "معتمد" : "غير معتمد"}
        className={`inline-block w-3 h-3 rounded-full ${
          row.original.bank_account_approved ? "bg-green-500" : "bg-red-500"
        }`}
      />
    ),
    size: 32,
  },
];
