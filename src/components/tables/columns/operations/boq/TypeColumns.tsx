import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Pencil, Trash } from "lucide-react";
import { BOQType } from "../../../../../hooks/operations/boq/useTypes";

type GetTypeColumnsArgs = {
  onEdit: (type: BOQType) => void;
  onDelete: (type: BOQType) => void;
};

export const getTypeColumns = ({
  onEdit,
  onDelete,
}: GetTypeColumnsArgs): ColumnDef<BOQType>[] => [
  {
    accessorKey: "name",
    header: "اسم النوع",
    cell: ({ row }) => (
      <Link
        to={`./${row.original.id}`}
        className="font-bold hover:underline hover:text-blue-600"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {new Date(row.original.created_at).toLocaleDateString("ar-LY")}
      </div>
    ),
    size: 130,
  },
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:text-primary"
          aria-label="تعديل النوع"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:text-error"
          aria-label="حذف النوع"
          onClick={() => onDelete(row.original)}
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    size: 100,
  },
];
