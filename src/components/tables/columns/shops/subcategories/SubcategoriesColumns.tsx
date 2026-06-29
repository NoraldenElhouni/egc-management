import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Subcategories } from "../../../../../types/global.type";

export const SubcategoriesColumns: ColumnDef<Subcategories>[] = [
  // Selection column (first column)
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
    header: "اسم التصنيف الفرعي",
    cell: ({ row }) => (
      <div>
        <Link
          to={`/subcategories/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },

  {
    accessorKey: "category_id",
    header: "التصنيف الرئيسي",
    cell: ({ row }) => <span>{row.original.category_id || "-"}</span>,
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
    cell: ({ row }) => (
      <span>
        {new Date(row.original.created_at).toLocaleDateString("ar-EG")}
      </span>
    ),
  },

  {
    accessorKey: "is_active",
    header: "الحالة",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Handle toggle logic here
              // You'll need to implement the update function
              // For example: updateSubcategoryStatus(row.original.id, !isActive)
            }}
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
