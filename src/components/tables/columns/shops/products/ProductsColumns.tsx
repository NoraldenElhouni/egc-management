// ProductsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatDate } from "../../../../../utils/helpper";

export type Products = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  image_path: string | null;
  subcategory_id: string;
  created_at: string;
  shop_subcategories?: {
    id: string;
    name: string;
    category_id: string;
    shop_categories?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export const getProductsColumns = (
  onToggleActive: (id: string, isActive: boolean) => void,
): ColumnDef<Products>[] => [
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
    header: "اسم المنتج",
    cell: ({ row }) => (
      <div>
        <Link
          to={`./${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },

  {
    accessorKey: "image_path",
    header: "الصورة",
    cell: ({ row }) => (
      <div>
        {row.original.image_path ? (
          <img
            src={row.original.image_path}
            alt={row.original.name}
            className="w-12 h-12 object-cover rounded-md"
          />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  },

  {
    id: "category",
    header: "التصنيف الرئيسي",
    accessorFn: (row) => row.shop_subcategories?.shop_categories?.name ?? "",
    cell: ({ row }) => (
      <span>
        {row.original.shop_subcategories?.shop_categories?.name || "-"}
      </span>
    ),
  },

  {
    id: "subcategory",
    header: "التصنيف الفرعي",
    accessorFn: (row) => row.shop_subcategories?.name ?? "",
    cell: ({ row }) => (
      <span>{row.original.shop_subcategories?.name || "-"}</span>
    ),
  },

  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => (
      <span className="truncate max-w-xs">
        {row.original.description || "-"}
      </span>
    ),
  },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => <span>{formatDate(row.original.created_at)}</span>,
  },

  {
    accessorKey: "is_active",
    header: "الحالة",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            dir="ltr"
            onClick={() => onToggleActive(row.original.id, !isActive)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isActive ? "bg-green-600" : "bg-gray-300"}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isActive ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
          <span
            className={`text-sm ${isActive ? "text-green-600" : "text-gray-500"}`}
          >
            {isActive ? "نشط" : "غير نشط"}
          </span>
        </div>
      );
    },
  },
];
