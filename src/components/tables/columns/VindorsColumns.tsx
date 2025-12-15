import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Vendor } from "../../../types/global.type";

export const VendorsColumns: ColumnDef<Vendor>[] = [
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
    accessorKey: "phone_number",
    header: "رقم الهاتف",
  },

  {
    accessorKey: "alt_phone_number",
    header: "رقم هاتف بديل",
    cell: ({ row }) =>
      row.original.alt_phone_number ? (
        row.original.alt_phone_number
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },

  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
  },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString("ar-LY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
];
