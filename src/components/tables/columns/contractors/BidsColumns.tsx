import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ContractorBid } from "../../../../types/contracts.type";
import { formatCurrency, formatDate } from "../../../../utils/helpper";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  accepted: "bg-green-100 text-green-800 border border-green-200",
  rejected: "bg-red-100 text-red-800 border border-red-200",
  withdrawn: "bg-gray-100 text-gray-600 border border-gray-200",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول",
  rejected: "مرفوض",
  withdrawn: "منسحب",
};

export const BidsColumns: ColumnDef<ContractorBid>[] = [
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
  {
    id: "bid_code",
    header: "كود العرض",
    accessorFn: (row) => row.id,
    cell: ({ row }) => (
      <Link
        to={`/operations/contracts/project/${row.original.work_requests.projects.id}/requests/${row.original.work_requests.id}/bids/${row.original.id}`}
        className="font-medium hover:underline text-primary"
      >
        #{row.original.id.trim().slice(0, 8)}
      </Link>
    ),
  },
  {
    id: "row.work_requests.projects.name",
    header: "اسم المشروع",
    accessorFn: (row) => `${row.work_requests.projects.name}`,
    cell: ({ row }) => (
      <Link
        to={`/operations/contracts/project/${row.original.work_requests.projects.id}`}
        className="font-medium hover:underline"
      >
        {row.original.work_requests.projects.name}
      </Link>
    ),
  },
  {
    id: "row.work_requests.title",
    header: "عنوان الطلب",
    accessorFn: (row) => row.work_requests.title,
    cell: ({ row }) => (
      <Link
        to={`/operations/contracts/project/${row.original.work_requests.projects.id}/requests/${row.original.work_requests.id}`}
        className="font-medium hover:underline"
      >
        {row.original.work_requests.title}
      </Link>
    ),
  },

  {
    accessorKey: "total_price",
    header: "السعر الإجمالي",
    cell: ({ getValue }) => (
      <span className="font-medium">{formatCurrency(getValue<number>())}</span>
    ),
  },

  {
    accessorKey: "days_needed",
    header: "المدة (أيام)",
    cell: ({ getValue }) => <span>{getValue<number>()} يوم</span>,
  },

  {
    accessorKey: "submitted_at",
    header: "تاريخ التقديم",
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-600">
        {formatDate(getValue<string>())}
      </span>
    ),
  },

  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusStyles[status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {statusLabels[status] ?? status}
        </span>
      );
    },
  },
];
