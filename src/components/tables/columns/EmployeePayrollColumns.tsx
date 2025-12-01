import { ColumnDef } from "@tanstack/react-table";
import { Payroll } from "../../../types/global.type";
import { formatCurrency, formatDate } from "../../../utils/helpper";

// Payroll table columns
export const EmployeePayrollColumns: ColumnDef<Payroll>[] = [
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
    accessorKey: "pay_date",
    header: "تاريخ الدفع",
    cell: ({ row }) => formatDate(row.original.pay_date),
  },
  {
    accessorKey: "basic_salary",
    header: "الراتب الأساسي",
    cell: ({ row }) =>
      row.original.basic_salary != null
        ? formatCurrency(row.original.basic_salary, "LYD")
        : "-",
  },
  {
    accessorKey: "percentage_salary",
    header: "النسبة",
    cell: ({ row }) =>
      row.original.percentage_salary != null
        ? `${row.original.percentage_salary}`
        : "-",
  },
  {
    accessorKey: "total_salary",
    header: "إجمالي الراتب",
    cell: ({ row }) => formatCurrency(row.original.total_salary, "LYD"),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
        {row.original.status}
      </span>
    ),
  },
];
