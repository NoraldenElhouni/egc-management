import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import { PayrollWithRelations } from "../../../types/extended.type";
import { Link } from "react-router-dom";
import AcceptPayrollPayments from "../actions/payroll/AcceptPayrollPayments";
import RejectPayrollPayments from "../actions/payroll/rejectPayrollPayments";
import { translateStatus } from "../../../utils/translations";
import { statusColor } from "../../../utils/colors/status";

// Payroll table columns
export const PayrollColumns: ColumnDef<PayrollWithRelations>[] = [
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
          to={`/hr/payroll/${row.original.id}`}
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
    header: "الإجمالي",
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(row.original.status)}`}
      >
        {translateStatus(row.original.status)}
      </span>
    ),
  },

  // Actions column
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <AcceptPayrollPayments payrollPaymentId={row.original.id} />
        <RejectPayrollPayments payrollPaymentId={row.original.id} />
      </div>
    ),
  },
];
