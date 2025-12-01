import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "../../../utils/helpper";
import { PayrollWithRelations } from "../../../types/extended.type";
import { Link } from "react-router-dom";

// Payroll table columns
export const PercentagesPayrollColumns: ColumnDef<PayrollWithRelations>[] = [
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
    accessorKey: "employees",
    accessorFn: (row) =>
      row.employees?.first_name + " " + row.employees?.last_name,
    header: "الموظف",
    cell: ({ row }) => {
      const employee = row.original.employees;
      if (!employee) return "N/A";
      return (
        <Link
          to={`/employees/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {`${employee.first_name} ${employee.last_name || ""}`.trim()}
        </Link>
      );
    },
  },
  {
    accessorKey: "pay_date",
    header: "تاريخ الدفع",
    cell: ({ row }) => formatDate(row.original.pay_date),
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
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
        {row.original.status}
      </span>
    ),
  },
];
