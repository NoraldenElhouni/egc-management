import { ColumnDef, FilterFnOption } from "@tanstack/react-table";

import {
  translateExpenseStatus,
  translateExpenseType,
} from "../../../utils/translations";

import { getExpenseStatusColor } from "../../../utils/colors/status";
import { Link } from "react-router-dom";
import { ExpenseWithProject } from "../../../types/projects.type";

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export const NotPiadExpenseColumns: ColumnDef<ExpenseWithProject>[] = [
  // SELECT CHECKBOX
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
    enableColumnFilter: false,
  },

  // SERIAL NUMBER
  {
    accessorKey: "serial_number",
    header: "الرقم",
    cell: ({ row }) => (
      <Link
        to={`/finance/bookkeeping/project/${row.original.project_id}/expense/${row.original.id}`}
        className="font-bold underline"
      >
        {row.original.serial_number}
      </Link>
    ),
    size: 32,
    enableColumnFilter: false,
  },

  // PROJECT – since this table spans multiple projects
  {
    id: "project",
    header: "المشروع",
    accessorFn: (row) =>
      row.projects
        ? `${row.projects.serial_number} ${row.projects.name}`
        : undefined,
    cell: ({ row }) => (
      <Link
        to={`/finance/bookkeeping/project/${row.original.project_id}`}
        className="underline whitespace-nowrap"
        title={row.original.projects?.name || ""}
      >
        {row.original.projects.serial_number} |{" "}
        {row.original.projects?.name || "N/A"}
      </Link>
    ),
    size: 150,
  },

  // DESCRIPTION
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => (
      <div
        className="max-w-[200px] truncate whitespace-nowrap"
        title={row.original.description || ""}
      >
        {row.original.description || "N/A"}{" "}
        <span className="text-red-500">
          {row.original.status === "deleted" ? "(محذوف)" : ""}{" "}
          {row.original.is_percentage ? "%" : ""}
        </span>
      </div>
    ),
    size: 200,
  },

  // VENDOR / CONTRACT NAME
  {
    id: "vendor_or_contract",
    header: "الاسم",
    accessorFn: (row) =>
      row.vendors?.vendor_name ??
      `${row.contractors?.first_name} ${row.contractors?.last_name}`,
    cell: ({ row }) => (
      <span>
        {row.original.vendors?.vendor_name ||
          `${row.original.contractors?.first_name} ${row.original.contractors?.last_name}` ||
          "N/A"}
      </span>
    ),
    size: 150,
  },

  // EXPENSE TYPE
  {
    accessorKey: "expense_type",
    header: "نوع المصروف",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-100 text-green-800">
        {translateExpenseType(row.original.expense_type)}
      </span>
    ),
    size: 100,
  },

  // TOTAL
  {
    accessorKey: "total_amount",
    header: "الإجمالي",
    filterFn: "numberRangeFilter" as FilterFnOption<ExpenseWithProject>,
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {toNum(row.original.total_amount).toLocaleString()} LYD
      </div>
    ),
    size: 120,
  },

  // AMOUNT PAID
  {
    accessorKey: "amount_paid",
    header: "المبلغ المدفوع",
    enableColumnFilter: false,
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {toNum(row.original.amount_paid).toLocaleString()} LYD
      </div>
    ),
    size: 120,
  },

  // REMAINING AMOUNT – the core figure for a "not paid" expenses table
  {
    id: "remaining_amount",
    header: "المبلغ المتبقي",
    enableColumnFilter: false,
    accessorFn: (row) => {
      const total = toNum(row.total_amount);
      const paid = toNum(row.amount_paid);
      const discount = toNum(row.discounting);
      return total - paid - discount;
    },
    cell: ({ row }) => {
      const total = toNum(row.original.total_amount);
      const paid = toNum(row.original.amount_paid);
      const discount = toNum(row.original.discounting);
      const rawRemaining = total - paid - discount;
      const isOverpaid = rawRemaining < 0;
      const remaining = Math.max(0, rawRemaining);

      return (
        <div
          className={`font-medium whitespace-nowrap ${
            remaining === 0
              ? "text-black"
              : isOverpaid
                ? "text-yellow-600"
                : "text-red-600"
          }`}
          title={
            isOverpaid
              ? `تم الدفع بزيادة ${Math.abs(rawRemaining).toLocaleString()} LYD`
              : ""
          }
        >
          {isOverpaid
            ? `-${Math.abs(rawRemaining).toLocaleString()} LYD`
            : `${remaining.toLocaleString()} LYD`}
        </div>
      );
    },
    size: 140,
  },

  // DATE
  {
    accessorKey: "expense_date",
    header: "التاريخ",
    filterFn: "dateRangeFilter" as FilterFnOption<ExpenseWithProject>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {new Date(row.original.expense_date).toLocaleDateString()}
      </div>
    ),
    size: 120,
  },

  // STATUS
  {
    accessorKey: "status",
    header: "الحالة",
    filterFn: "equalsString",
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
