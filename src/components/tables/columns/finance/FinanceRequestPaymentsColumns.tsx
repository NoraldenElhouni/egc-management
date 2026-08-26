import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Circle } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../utils/helpper";
import {
  translatePaymentMethod,
  translateStatus,
} from "../../../../utils/translations";
import { statusColor } from "../../../../utils/colors/status";
import { FinanceRequestPayment } from "../../../../hooks/finance/contracts/useFinanceRequestPayments";

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export const getFinanceRequestPaymentsColumns =
  (): ColumnDef<FinanceRequestPayment>[] => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="تحديد كل طلبات الدفع الظاهرة"
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
              aria-label={`تحديد طلب الدفع ${row.original.id}`}
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
      id: "contractor",
      header: "المقاول",
      filterFn: "equalsString",
      accessorFn: (row) =>
        row.contractor
          ? `${row.contractor.first_name ?? ""} ${row.contractor.last_name ?? ""}`.trim()
          : "",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">
          {row.original.contractor
            ? `${row.original.contractor.first_name} ${row.original.contractor.last_name ?? ""}`
            : "—"}
        </span>
      ),
    },
    {
      id: "project",
      header: "المشروع",
      filterFn: "equalsString",
      accessorFn: (row) => row.project?.name ?? "",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.project?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "serial",
      header: "رقم الدفعة",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          #
          {String(row.original.serial_number ?? row.index + 1).padStart(
            3,
            "0",
          )}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(toNum(row.original.amount), row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "penalty_amount",
      header: "مبلغ الجزاء",
      cell: ({ row }) => {
        const amount = toNum(row.original.penalty_amount);
        return (
          <span className="whitespace-nowrap">
            {amount === 0
              ? "-"
              : formatCurrency(amount, row.original.currency)}
          </span>
        );
      },
    },
    {
      accessorKey: "grand_total",
      header: "الإجمالي الكلي",
      cell: ({ row }) => (
        <span className="font-semibold whitespace-nowrap">
          {formatCurrency(
            toNum(row.original.grand_total),
            row.original.currency,
          )}
        </span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "طريقة الدفع",
      cell: ({ getValue }) => {
        const val = getValue<"cash" | "bank" | null>();
        return <span>{val ? translatePaymentMethod(val) : "—"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      filterFn: "equalsString",
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(status)}`}
          >
            {translateStatus(status)}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      filterFn: "dateRangeFilter",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      id: "requested_by",
      header: "طلب بواسطة",
      filterFn: "equalsString",
      accessorFn: (row) =>
        `${row.requester?.first_name ?? ""} ${row.requester?.last_name ?? ""}`.trim(),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.requester
            ? `${row.original.requester.first_name} ${row.original.requester.last_name ?? ""}`
            : "—"}
        </span>
      ),
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
