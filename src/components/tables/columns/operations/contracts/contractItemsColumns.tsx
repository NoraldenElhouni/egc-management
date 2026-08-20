// components/tables/columns/operations/contracts/contractItemsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "../../../../../utils/helpper";
import { ContractItemRow } from "../../../../../hooks/operations/contracts/useContracts";

export const contractItemsColumns: ColumnDef<ContractItemRow>[] = [
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
    cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "unit",
    header: "الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-600 text-sm">{getValue<string>()}</span>
    ),
    size: 90,
  },
  {
    accessorKey: "quantity",
    header: "الكمية",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<number>()}</span>
    ),
    size: 100,
  },
  {
    accessorKey: "unit_price",
    header: "سعر الوحدة",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{formatCurrency(getValue<number>())}</span>
    ),
    size: 130,
  },
  {
    accessorKey: "total_price",
    header: "الإجمالي",
    cell: ({ row }) => {
      const total =
        row.original.total_price ??
        row.original.quantity * row.original.unit_price;
      return (
        <span className="font-semibold text-gray-900">
          {formatCurrency(total)}
        </span>
      );
    },
    size: 140,
  },
];
