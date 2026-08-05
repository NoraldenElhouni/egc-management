import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Zone } from "../../../../../hooks/operations/boq/useZones";

type GetZoneColumnsArgs = {
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
};

export const getZoneColumns = ({
  onEdit,
  onDelete,
}: GetZoneColumnsArgs): ColumnDef<Zone>[] => [
  {
    accessorKey: "name",
    header: "اسم المنطقة",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
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
          aria-label="تعديل المنطقة"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:text-error"
          aria-label="حذف المنطقة"
          onClick={() => onDelete(row.original)}
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    size: 100,
  },
];
