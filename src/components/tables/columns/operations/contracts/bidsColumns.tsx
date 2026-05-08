import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { RequestBids } from "../../../../../types/contracts.type";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";

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

export const BidsColumns: ColumnDef<RequestBids>[] = [
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
    id: "contractor_name",
    header: "المقاول",
    accessorFn: (row) =>
      `${row.contractors.first_name} ${row.contractors.last_name ?? ""}`,
    cell: ({ row }) => (
      <Link to={`./${row.original.id}`} className="font-medium hover:underline">
        {row.original.contractors.first_name}{" "}
        {row.original.contractors.last_name ?? ""}
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

  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => console.log("accept", row.original.id)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          قبول
        </button>
        <button
          onClick={() => console.log("reject", row.original.id)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
        >
          رفض
        </button>
      </div>
    ),
  },
];
