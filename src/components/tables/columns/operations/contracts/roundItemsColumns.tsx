import { ColumnDef } from "@tanstack/react-table";
import { RoundItemRow } from "../../../../../hooks/operations/contracts/rounds/useRounds";

export const roundItemsColumns: ColumnDef<RoundItemRow>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.index + 1}</span>
    ),
    size: 40,
  },
  {
    accessorKey: "name",
    header: "البند",
    cell: ({ row }) => (
      <div>
        <span className="font-semibold text-gray-900">
          {row.original.name}
        </span>
        {!row.original.boq_item_id && (
          <span className="mr-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
            بند مخصص
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "unit",
    header: "الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "الكمية",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "sort_order",
    header: "الترتيب",
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-sm">{getValue<number>()}</span>
    ),
  },
];
