import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/helpper";

// النوع يمثل صف واحد في جدول "التفاصيل حسب المشروع"
export interface ExpenseStatByProject {
  project_id: string;
  project_name: string;
  usage_count: number;
  total_amount: number;
  avg_amount: number;
  last_used: string;
}

export const expenseByProjectColumns: ColumnDef<ExpenseStatByProject>[] = [
  // عمود التحديد
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          aria-label="تحديد جميع الصفوف"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          checked={table.getIsAllPageRowsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          aria-label={`تحديد الصف ${row.index + 1}`}
          onChange={row.getToggleSelectedHandler()}
          checked={row.getIsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    size: 40,
  },

  // اسم المشروع — قابل للنقر للانتقال لصفحة المشروع
  {
    accessorKey: "project_name",
    header: "المشروع",
    cell: ({ row }) => (
      <Link
        to={`/finance/bookkeeping/project/${row.original.project_id}`}
        className="font-medium hover:underline"
      >
        {row.original.project_name}
      </Link>
    ),
  },

  // عدد الاستخدامات
  {
    accessorKey: "usage_count",
    header: "عدد الاستخدامات",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.usage_count}</span>
    ),
  },

  // الإجمالي
  {
    accessorKey: "total_amount",
    header: "الإجمالي",
    cell: ({ row }) => (
      <span className="tabular-nums font-medium">
        {formatCurrency(row.original.total_amount)}
      </span>
    ),
  },

  // المتوسط لكل استخدام
  {
    accessorKey: "avg_amount",
    header: "المتوسط / استخدام",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatCurrency(row.original.avg_amount)}
      </span>
    ),
  },

  // آخر استخدام
  {
    accessorKey: "last_used",
    header: "آخر استخدام",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.last_used || "—"}
      </span>
    ),
  },
];
