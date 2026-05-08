import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Database } from "../../../../../lib/supabase";
import { WorkRequests } from "../../../../../types/global.type";

type WorkRequestStatus = Database["public"]["Enums"]["work_request_status"];
type WorkRequestMode = Database["public"]["Enums"]["work_request_mode"];

// ── helpers ──────────────────────────────────────────────────────────────────

const translateRequestStatus = (status: WorkRequestStatus): string => {
  const map: Record<WorkRequestStatus, string> = {
    draft: "مسودة",
    open: "مفتوح",
    bidding: "قيد التقديم",
    awarded: "تم الترسية",
    cancelled: "ملغى",
  };
  return map[status] ?? status;
};

const getRequestStatusColor = (status: WorkRequestStatus): string => {
  const map: Record<WorkRequestStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    open: "bg-green-100 text-green-700",
    bidding: "bg-yellow-100 text-yellow-700",
    awarded: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
};
const translateRequestMode = (mode: WorkRequestMode): string => {
  const map: Record<WorkRequestMode, string> = {
    open: "مفتوح",
    direct: "مباشر",
  };
  return map[mode] ?? mode;
};

// ── columns ──────────────────────────────────────────────────────────────────

export const WorkRequestsColumns: ColumnDef<WorkRequests>[] = [
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

  // Title / link
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ row }) => (
      <div className="font-medium">
        <Link
          to={`/operations/contracts/project/${row.original.project_id}/requests/${row.original.id}`}
          className="hover:text-blue-600 transition-colors"
        >
          {row.original.title}
        </Link>
      </div>
    ),
    size: 200,
  },

  // Status
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRequestStatusColor(
          row.original.status,
        )}`}
      >
        {translateRequestStatus(row.original.status)}
      </span>
    ),
    size: 120,
  },

  // Mode
  {
    accessorKey: "mode",
    header: "النوع",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {translateRequestMode(row.original.mode)}
      </span>
    ),
    size: 100,
  },

  // Description
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px] text-gray-500 text-sm">
        {row.original.description ?? "—"}
      </div>
    ),
    size: 200,
  },

  // Bid deadline
  {
    accessorKey: "bid_deadline",
    header: "آخر موعد للعروض",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.bid_deadline
          ? new Date(row.original.bid_deadline).toLocaleDateString("ar-LY")
          : "—"}
      </div>
    ),
    size: 150,
  },

  // Work start
  {
    accessorKey: "work_start_at",
    header: "تاريخ بدء العمل",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.work_start_at
          ? new Date(row.original.work_start_at).toLocaleDateString("ar-LY")
          : "—"}
      </div>
    ),
    size: 150,
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
