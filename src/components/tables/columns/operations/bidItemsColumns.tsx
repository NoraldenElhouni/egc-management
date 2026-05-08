// components/tables/columns/operations/contracts/bidItemsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "../../../../utils/helpper";
import { BidItem } from "../../../../hooks/operations/contracts/requests/useRequests";

export const BidItemsColumns: ColumnDef<BidItem>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.index + 1}</span>
    ),
    size: 40,
  },
  {
    id: "service_name",
    header: "الخدمة",
    accessorFn: (row) => row.work_request_items.services.name,
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">{getValue<string>()}</span>
    ),
  },
  {
    id: "description",
    header: "الوصف",
    accessorFn: (row) => row.work_request_items.description,
    cell: ({ getValue }) => (
      <span className="text-gray-500 text-sm">{getValue<string>() ?? "—"}</span>
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
    accessorKey: "unit",
    header: "الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<string>()}</span>
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
    accessorKey: "total_price",
    header: "الإجمالي",
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "notes",
    header: "ملاحظات",
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-sm">{getValue<string>() ?? "—"}</span>
    ),
  },
];
