// CategoriesColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Categories } from "../../../../../types/global.type";
import { formatDate } from "../../../../../utils/helpper";
import { DynamicIcon, IconName } from "lucide-react/dynamic";

export const getCategoriesColumns = (
  onToggleActive: (id: string, isActive: boolean) => void,
  divisionNameById: Record<string, string>,
  getRowLink: (category: Categories) => string = (category) =>
    `./${category.id}`,
): ColumnDef<Categories>[] => [
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
    header: "اسم التصنيف",
    cell: ({ row }) => (
      <div>
        <Link
          to={getRowLink(row.original)}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },

  {
    accessorKey: "icon_path",
    header: "الأيقونة",
    cell: ({ row }) => (
      <div>
        {row.original.icon_path ? (
          <DynamicIcon
            name={row.original.icon_path as IconName}
            className="w-6 h-6 text-foreground"
          />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  },

  {
    accessorKey: "division_id",
    header: "القسم",
    cell: ({ row }) => (
      <span>{divisionNameById[row.original.division_id] || "-"}</span>
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
