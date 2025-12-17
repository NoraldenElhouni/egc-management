import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { InvoiceType } from "../../../hooks/finance/useInvoices";
import { translateExpenseStatus } from "../../../utils/translations";
import { getExpenseStatusColor } from "../../../utils/colors/status";
import { formatCurrency } from "../../../utils/helpper";

export const InvoicesColumns: ColumnDef<InvoiceType>[] = [
  // Selection column (first column)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          // toggle all visible (page) rows
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
    // keep this column narrow
    size: 32,
  },
  {
    accessorKey: "invoice_no",
    header: "رقم الفاتورة #",
    cell: ({ row }) => (
      <div className="font-bold">
        <Link
          to={`/finance/bookkeeping/project/${row.original.project_expenses?.project_id}/expense/${row.original.id}`}
        >
          {row.original.invoice_no ? row.original.invoice_no : "N/A"}
        </Link>
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "payment_no",
    header: "رقم الدفع #",
    size: 110,
  },
  {
    id: "project_description",
    header: "الوصف",
    accessorFn: (row) => row.project_expenses?.description ?? "",
    size: 300,
  },
  {
    accessorKey: "amount",
    header: "القيمة",
    cell: ({ row }) => <div>{formatCurrency(row.original.amount)}</div>,
    size: 120,
  },

  {
    id: "project_total",
    header: "إجمالي المصروفات",
    accessorFn: (row) => row.project_expenses?.total_amount ?? 0,
    cell: ({ row }) => (
      <div>
        {formatCurrency(row.original.project_expenses?.total_amount ?? 0)}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    size: 140,
  },

  {
    id: "project_status",
    header: "الحالة",
    accessorFn: (row) => row.project_expenses?.status ?? null,
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getExpenseStatusColor(
          row.original.project_expenses?.status || "pending"
        )}`}
      >
        {translateExpenseStatus(
          row.original.project_expenses?.status || "pending"
        )}
      </span>
    ),
    size: 140,
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {new Date(row.original.created_at).toLocaleDateString()}
      </div>
    ),
    size: 180,
  },
];
