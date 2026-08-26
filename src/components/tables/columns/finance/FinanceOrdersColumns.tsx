import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { formatDate, formatCurrency } from "../../../../utils/helpper";
import { statusLabel, statusStyle } from "../../../../utils/orderStatus";
import { FinanceOrderRow } from "../../../../hooks/finance/orders/useFinanceOrders";

export const getFinanceOrdersColumns = (): ColumnDef<FinanceOrderRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          aria-label="تحديد كل الطلبات الظاهرة"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          checked={table.getIsAllPageRowsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) =>
      row.getCanSelect() ? (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label={`تحديد الطلب ${row.original.id}`}
            onChange={row.getToggleSelectedHandler()}
            checked={row.getIsSelected()}
            className="w-4 h-4 rounded border-gray-300"
          />
        </div>
      ) : null,
    size: 32,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "id",
    header: "رقم الطلب",
    cell: ({ row }) => (
      <Link
        to={`/shops/orders/project/${row.original.project_id}/${row.original.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        #{row.original.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    id: "project",
    header: "المشروع",
    filterFn: "equalsString",
    accessorFn: (row) => row.projects?.name ?? "",
    cell: ({ row }) => (
      <span className="text-gray-700">
        {row.original.projects?.name || "—"}
      </span>
    ),
  },
  {
    id: "vendor",
    header: "المورد",
    filterFn: "equalsString",
    accessorFn: (row) => row.vendors?.vendor_name ?? "",
    cell: ({ row }) => <span>{row.original.vendors?.vendor_name || "—"}</span>,
  },
  {
    accessorKey: "status",
    header: "الحالة",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle(status)}`}
        >
          {statusLabel(status)}
        </span>
      );
    },
  },
  {
    accessorKey: "total_price",
    header: "الإجمالي",
    cell: ({ row }) => {
      const v = row.original.total_price;
      return v != null ? formatCurrency(v, "LYD") : "-";
    },
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    filterFn: "dateRangeFilter",
    cell: ({ row }) => <span>{formatDate(row.original.created_at)}</span>,
  },
  {
    id: "finance_entry_status",
    header: "الحالة المالية",
    cell: ({ row }) => {
      const entered = row.original.finance_entered;
      if (!entered) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <Circle className="w-3.5 h-3.5" />
            لم تُدخل بعد
          </span>
        );
      }
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
          title={
            row.original.finance_entered_at
              ? formatDate(row.original.finance_entered_at)
              : undefined
          }
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          تم إدخالها في النظام
        </span>
      );
    },
  },
];
