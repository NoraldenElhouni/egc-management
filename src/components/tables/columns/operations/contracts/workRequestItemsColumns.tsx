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
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">{getValue<string>()}</span>
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
    id: "service_id",
    header: "رقم الخدمة",
    accessorFn: (row) => row.services?.id,
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-sm font-mono">
        {/* Show a short code — replace with real SKU if you add it later */}
        {`SVC-${getValue<string>().slice(0, 6).toUpperCase()}`}
      </span>
    ),
  },
];
