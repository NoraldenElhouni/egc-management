import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { ContractListRow } from "../../../../../hooks/operations/contracts/useContracts";

// ── helpers ──────────────────────────────────────────────────────────────────

const translateContractStatus = (
  status: ContractListRow["status"],
): string => {
  const map: Record<ContractListRow["status"], string> = {
    draft: "مسودة",
    active: "نشط",
    completed: "مكتمل",
    cancelled: "ملغى",
  };
  return map[status] ?? status;
};

const getContractStatusColor = (status: ContractListRow["status"]): string => {
  const map: Record<ContractListRow["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
};

// ── columns ──────────────────────────────────────────────────────────────────

export const ContractsColumns: ColumnDef<ContractListRow>[] = [
  // Selection
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

  // Contract ID / link
  {
    accessorKey: "id",
    header: "رقم العقد #",
    cell: ({ row }) => (
      <div className="font-bold">
        <Link
          to={`/operations/contracts/project/${row.original.project_id}/${row.original.id}`}
        >
          {row.original.id.slice(0, 8).toUpperCase()}
        </Link>
      </div>
    ),
    size: 130,
  },

  // Round title
  {
    id: "round",
    header: "الجولة",
    cell: ({ row }) => (
      <span className="text-gray-700 text-sm">
        {row.original.rounds?.title ?? "—"}
      </span>
    ),
  },

  // Contractor
  {
    id: "contractor",
    header: "المقاول",
    cell: ({ row }) => {
      const contractor = row.original.contractor;
      return (
        <span className="text-gray-700">
          {contractor
            ? `${contractor.first_name} ${contractor.last_name ?? ""}`
            : "—"}
        </span>
      );
    },
  },

  // Status
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getContractStatusColor(
          row.original.status,
        )}`}
      >
        {translateContractStatus(row.original.status)}
      </span>
    ),
    size: 120,
  },

  // Total amount
  {
    accessorKey: "total_amount",
    header: "إجمالي المبلغ",
    cell: ({ row }) => <div>{formatCurrency(row.original.total_amount)}</div>,
    size: 140,
  },

  // Start date
  {
    accessorKey: "start_date",
    header: "تاريخ البداية",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.start_date ? formatDate(row.original.start_date) : "—"}
      </div>
    ),
    size: 130,
  },

  // End date
  {
    accessorKey: "end_date",
    header: "تاريخ الانتهاء",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.end_date ? formatDate(row.original.end_date) : "—"}
      </div>
    ),
    size: 130,
  },

  // Created at
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {formatDate(row.original.created_at)}
      </div>
    ),
    size: 130,
  },
];
