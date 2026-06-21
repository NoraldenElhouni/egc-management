// components/tables/columns/operations/workRequestItemsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { WorkRequestItem } from "../../../../../hooks/operations/contracts/requests/useRequests";

export const WorkRequestItemsColumns: ColumnDef<WorkRequestItem>[] = [
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
    header: "البند / الخدمة",
    accessorFn: (row) => row.services?.name,
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900">
        {row.original.services?.name ?? row.original.custom_name}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => (
      <span className="text-gray-500 text-sm">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "الكمية",
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.quantity}</span>
    ),
  },
  {
    accessorKey: "unit",
    header: "الوحدة",
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.unit}</span>
    ),
  },
];
