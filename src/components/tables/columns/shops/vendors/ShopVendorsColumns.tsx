// components/tables/columns/shops/vendors/ShopVendorsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { VendorsWithSpecializations } from "../../../../../types/extended.type";

export const getShopVendorsColumns = (
  onToggleShop: (id: string, isShop: boolean) => void,
): ColumnDef<VendorsWithSpecializations>[] => [
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
    accessorKey: "is_shop",
    header: "متجر",
    cell: ({ row }) => {
      const isShop = row.original.is_shop;
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            dir="ltr"
            onClick={() => onToggleShop(row.original.id, !isShop)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isShop ? "bg-green-600" : "bg-gray-300"}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isShop ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
          <span
            className={`text-sm ${isShop ? "text-green-600" : "text-gray-500"}`}
          >
            {isShop ? "مفعل" : "غير مفعل"}
          </span>
        </div>
      );
    },
  },
];
