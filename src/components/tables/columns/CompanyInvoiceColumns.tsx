import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { CompanyExpense } from "../../../types/global.type";
import { formatCurrency, formatDate } from "../../../utils/helpper";

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

  // 2. Date Column (Formatted for easier reading)
  {
    accessorKey: "expense_date",
    header: "التاريخ",
    cell: ({ row }) => {
      const date = row.original.expense_date;
      return <div>{formatDate(date)}</div>;
    },
  },

  // 3. Description (The main link to details)
  {
    accessorKey: "description",
    header: "الوصف / البيان",
    cell: ({ row }) => (
      <div>
        <Link
          to={`/finance/company/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.description || "بدون وصف"}
        </Link>
      </div>
    ),
  },

  // 4. Expense Type (Category)
  {
    accessorKey: "type",
    header: "النوع",
    cell: ({ row }) => (
      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
        {row.original.type}
      </span>
    ),
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

  // 6. Reference ID (Optional small text)
  {
    accessorKey: "reference_id",
    header: "رقم المرجع",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">
        {row.original.reference_id || "-"}
      </span>
    ),
  },
];
