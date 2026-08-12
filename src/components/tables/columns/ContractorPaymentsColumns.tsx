import { ColumnDef } from "@tanstack/react-table";
import { ContractPayment } from "../../../types/contracts.type";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import { translatePaymentMethod, translateStatus } from "../../../utils/translations";
import { statusColor } from "../../../utils/colors/status";
import ContractPaymentActionsCell from "../actions/payments/ContractPaymentActionsCell";

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export function getContractorPaymentsColumns(
  onRefresh?: () => void,
): ColumnDef<ContractPayment>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="تحديد كل الدفعات المعتمدة الظاهرة"
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
              aria-label={`تحديد الدفعة ${row.original.payments_number}`}
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
      accessorFn: (row) =>
        row.contractor
          ? `${row.contractor.first_name ?? ""} ${row.contractor.last_name ?? ""}`.trim()
          : (row.new_contractor_name ?? ""),
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">
          {row.original.contractor
            ? `${row.original.contractor.first_name} ${row.original.contractor.last_name ?? ""}`
            : (row.original.new_contractor_name ?? "—")}
        </span>
      ),
    },
    {
      id: "project",
      header: "المشروع",
      accessorFn: (row) => row.project?.name ?? "",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.project?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "payments_number",
      header: "رقم الدفعة",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
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
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatCurrency(
            toNum(row.original.penalty_amount),
            row.original.currency,
          )}
        </span>
      ),
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
      accessorKey: "method",
      header: "طريقة الدفع",
      cell: ({ getValue }) => (
        <span>
          {translatePaymentMethod(
            getValue<"cash" | "cheque" | "transfer" | "deposit" | "bank">(),
          )}
        </span>
      ),
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
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      id: "created_by",
      header: "أنشئ بواسطة",
      accessorFn: (row) =>
        `${row.created_by_employee?.first_name ?? ""} ${row.created_by_employee?.last_name ?? ""}`.trim(),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.created_by_employee
            ? `${row.original.created_by_employee.first_name} ${row.original.created_by_employee.last_name ?? ""}`
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      enableSorting: false,
      cell: ({ row }) => (
        <ContractPaymentActionsCell
          payment={row.original}
          onRefresh={onRefresh}
        />
      ),
    },
  ];
}
