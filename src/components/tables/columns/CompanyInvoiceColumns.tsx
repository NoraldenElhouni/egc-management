import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { CompanyExpense } from "../../../types/global.type";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import {
  translateCompanyExpenseType,
  translateExpenseStatus,
} from "../../../utils/translations";
import { getExpenseStatusColor } from "../../../utils/colors/status";

export const CompanyInvoiceColumns: ColumnDef<CompanyExpense>[] = [
  // 1. Selection Column
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
  // 6. Reference ID (Optional small text)
  {
    accessorKey: "serial_number",
    header: "رقم التسلسلي",
    cell: ({ row }) => (
      <Link
        to={`/finance/company/expense/${row.original.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.original.serial_number || "-"}
      </Link>
    ),
  },

  // 3. Description (The main link to details)
  {
    accessorKey: "description",
    header: "الوصف / البيان",
    cell: ({ row }) => <div>{row.original.description || "بدون وصف"}</div>,
  },

  // 4. Expense Type (Category)
  {
    accessorKey: "type",
    header: "النوع",
    cell: ({ row }) => (
      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
        {translateCompanyExpenseType(row.original.type)}
      </span>
    ),
  },

  {
    accessorKey: "amount_paid",
    header: "المبلغ المدفوع",
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {formatCurrency(row.original.amount_paid)}
      </div>
    ),
    size: 120,
  },

  // 5. Amount (Formatted as currency)
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
        <div className="font-bold text-right">{formatCurrency(amount)}</div>
      );
    },
  },

  // 2. Date Column (Formatted for easier reading)
  {
    accessorKey: "expense_date",
    header: "التاريخ",
    cell: ({ row }) => {
      const date = row.original.expense_date;
      return <div>{formatDate(date)}</div>;
    },
  },

  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getExpenseStatusColor(
          row.original.status || "pending",
        )}`}
      >
        {translateExpenseStatus(row.original.status || "pending")}
      </span>
    ),
    size: 140,
  },
];
