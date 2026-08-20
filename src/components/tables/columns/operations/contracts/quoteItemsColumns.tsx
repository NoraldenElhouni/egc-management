import { ColumnDef } from "@tanstack/react-table";
import { QuoteItemRow } from "../../../../../hooks/operations/contracts/rounds/useQuotes";
import { formatCurrency } from "../../../../../utils/helpper";

export const quoteItemsColumns: ColumnDef<QuoteItemRow>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.index + 1}</span>
    ),
    size: 40,
  },
  {
    id: "name",
    header: "البند",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <div>
        <span className="font-semibold text-gray-900">
          {row.original.name ?? "—"}
        </span>
        {row.original.round_item_id === null && (
          <span className="mr-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
            إضافي
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "unit",
    header: "الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<string | null>() ?? "—"}</span>
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
    accessorKey: "unit_price",
    header: "سعر الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-700">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    id: "total_price",
    header: "الإجمالي",
    accessorFn: (row) => row.total_price ?? row.quantity * row.unit_price,
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "note",
    header: "ملاحظات",
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-sm">
        {getValue<string | null>() ?? "—"}
      </span>
    ),
  },
];
