import { ColumnDef } from "@tanstack/react-table";

// ⬅ Your translation utils
import {
  translateExpenseStatus,
  translateExpenseType,
  translatePhase,
} from "../../../utils/translations";

import { getExpenseStatusColor } from "../../../utils/colors/status";
import { Link } from "react-router-dom";
import { Expense } from "../../../types/projects.type";

// Safe number conversion
const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export const ProjectsExpensesColumns: ColumnDef<Expense>[] = [
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
  },

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

  {
    id: "vendor_or_contract",
    header: "الاسم",
    accessorFn: (row) => row.vendor_name ?? row.contract_name,
    cell: ({ row }) => (
      <span>
        {row.original.vendor_name || row.original.contract_name || "N/A"}
      </span>
    ),
    size: 150,
  },

  // EXPENSE TYPE (عمالة / مواد)
  {
    accessorKey: "expense_type",
    header: "نوع المصروف",
    cell: ({ row }) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-100 text-green-800">
        {translateExpenseType(row.original.expense_type)}
      </span>
    ),
    size: 100,
  },

  // PHASE (إنشاء / تشطيب)
  {
    accessorKey: "phase",
    header: "المرحلة",
    cell: ({ row }) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-orange-100 text-orange-800">
        {translatePhase(row.original.phase)}
      </span>
    ),
    size: 120,
  },

  // TOTAL
  {
    accessorKey: "total_amount",
    header: "الإجمالي",
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
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {toNum(row.original.amount_paid).toLocaleString()} LYD
      </div>
    ),
    size: 120,
  },

  // REMAINING AMOUNT (handles negative / overpay)
  {
    accessorKey: "remaining_amount",
    header: "المبلغ المتبقي",
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

  // DISCOUNTING
  {
    accessorKey: "discounting",
    header: "الخصم",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.discounting
          ? `${toNum(row.original.discounting).toLocaleString()} LYD`
          : "N/A"}
      </div>
    ),
    size: 100,
  },

  // DATE
  {
    accessorKey: "expense_date",
    header: "التاريخ",
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
