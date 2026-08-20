import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { RoundListRow } from "../../../../../hooks/operations/contracts/rounds/useRounds";
import { formatDate } from "../../../../../utils/helpper";

type RoundStatus = RoundListRow["status"];

const statusLabels: Record<RoundStatus, string> = {
  draft: "مسودة",
  pricing: "قيد التسعير",
  awarded: "تم الترسية",
  cancelled: "ملغى",
};

const statusColors: Record<RoundStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pricing: "bg-yellow-100 text-yellow-700",
  awarded: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export const RoundsColumns: ColumnDef<RoundListRow>[] = [
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ row }) => (
      <Link
        to={`/operations/contracts/project/${row.original.project_id}/rounds/${row.original.id}`}
        className="font-medium hover:text-blue-600 transition-colors"
      >
        {row.original.title}
      </Link>
    ),
    size: 220,
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          statusColors[row.original.status]
        }`}
      >
        {statusLabels[row.original.status]}
      </span>
    ),
    size: 120,
  },
  {
    id: "specialization",
    header: "التخصص",
    accessorFn: (row) => row.specialization?.name ?? "—",
    cell: ({ getValue }) => (
      <span className="text-gray-600 text-sm">{getValue<string>()}</span>
    ),
  },
  {
    id: "quotes_count",
    header: "عدد العروض",
    accessorFn: (row) => row.quotes?.[0]?.count ?? 0,
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<number>()}</span>
    ),
  },
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
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-600">
        {formatDate(getValue<string>())}
      </span>
    ),
    size: 130,
  },
];
