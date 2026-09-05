import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../../utils/helpper";
import {
  translateExpenseType,
  translatePaymentMethod,
  translatePhase,
} from "../../../../utils/translations";
import { UndistributedExpensePaymentRow } from "../../../../hooks/finance/distribution/useUndistributedExpensePayments";

export const undistributedExpensePaymentsColumns: ColumnDef<UndistributedExpensePaymentRow>[] =
  [
    {
      id: "expense",
      header: "المصروف",
      accessorFn: (row) => row.expenseDescription ?? "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.logType === "refund" && (
            <span className="flex-shrink-0 rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5">
              استرداد
            </span>
          )}
          <span className="font-medium text-gray-900">
            {row.original.expenseDescription || "—"}
          </span>
          {row.original.expenseSerial != null && (
            <span className="text-gray-400 font-mono text-xs">
              #{String(row.original.expenseSerial).padStart(3, "0")}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "party",
      header: "المورد / المقاول",
      accessorFn: (row) => row.vendorName ?? row.contractorName ?? "",
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.original.vendorName || row.original.contractorName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "expenseType",
      header: "النوع",
      cell: ({ getValue }) => {
        const val = getValue<UndistributedExpensePaymentRow["expenseType"]>();
        return <span>{val ? translateExpenseType(val) : "—"}</span>;
      },
    },
    {
      accessorKey: "phase",
      header: "المرحلة",
      cell: ({ getValue }) => {
        const val = getValue<UndistributedExpensePaymentRow["phase"]>();
        return <span>{val ? translatePhase(val) : "—"}</span>;
      },
    },
    {
      accessorKey: "paymentAmount",
      header: "مبلغ الدفعة",
      cell: ({ row }) => {
        const v = row.original.paymentAmount;
        return (
          <span
            className={`font-medium whitespace-nowrap ${
              v != null && v < 0 ? "text-red-600" : ""
            }`}
          >
            {v != null ? formatCurrency(v, row.original.currency) : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "percentage",
      header: "النسبة %",
      cell: ({ getValue }) => <span>{getValue<number>()}%</span>,
    },
    {
      accessorKey: "percentageAmount",
      header: "مبلغ الشركة",
      cell: ({ row }) => (
        <span
          className={`font-semibold whitespace-nowrap ${
            row.original.percentageAmount < 0
              ? "text-red-600"
              : "text-blue-700"
          }`}
        >
          {formatCurrency(row.original.percentageAmount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "طريقة الدفع",
      cell: ({ getValue }) => {
        const val = getValue<UndistributedExpensePaymentRow["paymentMethod"]>();
        return <span>{val ? translatePaymentMethod(val) : "—"}</span>;
      },
    },
    {
      accessorKey: "expenseDate",
      header: "تاريخ الدفعة",
      filterFn: "dateRangeFilter",
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        return (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {val ? formatDate(val) : "—"}
          </span>
        );
      },
    },
  ];
