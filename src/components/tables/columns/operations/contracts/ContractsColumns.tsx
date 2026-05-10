import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../../../utils/helpper";
import { Database } from "../../../../../lib/supabase";
import { Contracts } from "../../../../../types/global.type";

type ContractStatus = Database["public"]["Enums"]["contract_status"];

// ── helpers ──────────────────────────────────────────────────────────────────

const translateContractStatus = (status: ContractStatus): string => {
  const map: Record<ContractStatus, string> = {
    active: "نشط",
    completed: "مكتمل",
    on_hold: "قيد الانتظار",
    terminated: "منتهي",
  };
  return map[status] ?? status;
};

const getContractStatusColor = (status: ContractStatus): string => {
  const map: Record<ContractStatus, string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    on_hold: "bg-yellow-100 text-yellow-700",
    terminated: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
};

// ── columns ──────────────────────────────────────────────────────────────────

export const ContractsColumns: ColumnDef<Contracts>[] = [
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

  // Days allocated
  {
    accessorKey: "days_allocated",
    header: "الأيام المخصصة",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.original.days_allocated} يوم</div>
    ),
    size: 130,
  },

  // Start date
  {
    accessorKey: "start_date",
    header: "تاريخ البداية",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.start_date
          ? new Date(row.original.start_date).toLocaleDateString("ar-LY")
          : "—"}
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
        {row.original.end_date
          ? new Date(row.original.end_date).toLocaleDateString("ar-LY")
          : "—"}
      </div>
    ),
    size: 130,
  },

  // Notes
  {
    accessorKey: "notes",
    header: "ملاحظات",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px] text-gray-500 text-sm">
        {row.original.notes ?? "—"}
      </div>
    ),
    size: 200,
  },

  // Created at
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
];
