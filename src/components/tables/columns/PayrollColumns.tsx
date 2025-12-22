import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import { PayrollWithRelations } from "../../../types/extended.type";
import { Link } from "react-router-dom";
import AcceptPayrollPayments from "../actions/payroll/AcceptPayrollPayments";
import RejectPayrollPayments from "../actions/payroll/rejectPayrollPayments";
import {
  translatePaymentMethod,
  translateStatus,
} from "../../../utils/translations";
import { statusColor } from "../../../utils/colors/status";
import { paymentMethodColor } from "../../../utils/colors/payment_method";

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
    cell: ({ row }) => {
      const v = row.original.basic_salary;
      return v != null && v !== 0 ? formatCurrency(v, "LYD") : "-";
    },
  },
  {
    accessorKey: "percentage_salary",
    header: "النسبة",
    cell: ({ row }) => {
      const v = row.original.percentage_salary;
      return v != null && v !== 0 ? formatCurrency(v, "LYD") : "-";
    },
  },
  {
    accessorKey: "total_salary",
    header: "الإجمالي",
    cell: ({ row }) => {
      const v = row.original.total_salary;
      return v != null && v !== 0 ? formatCurrency(v, "LYD") : "-";
    },
  },
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    accessorFn: (row) => translatePaymentMethod(row.payment_method),
    cell: ({ row }) => (
      <div
        className={`${paymentMethodColor(row.original.payment_method)} px-2 py-0.5 rounded text-xs font-medium inline-block`}
      >
        {translatePaymentMethod(row.original.payment_method)}
      </div>
    ),
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
