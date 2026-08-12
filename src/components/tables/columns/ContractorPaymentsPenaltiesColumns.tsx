import { ColumnDef } from "@tanstack/react-table";
import { ContractPaymentPenalty } from "../../../types/contracts.type";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import { translateStatus } from "../../../utils/translations";
import { statusColor } from "../../../utils/colors/status";
import ContractPaymentPenaltyActionsCell from "../actions/payments/ContractPaymentPenaltyActionsCell";

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export function getContractorPenaltiesColumns(
  onRefresh?: () => void,
): ColumnDef<ContractPaymentPenalty>[] {
  return [
    {
      id: "contractor",
      header: "المقاول",
      accessorFn: (row) =>
        `${row.contractor?.first_name ?? ""} ${row.contractor?.last_name ?? ""}`.trim(),
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
      accessorFn: (row) => row.project?.name ?? "",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.project?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ getValue }) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(toNum(getValue()))}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "السبب",
      cell: ({ row }) => (
        <div
          className="max-w-[240px] truncate"
          title={row.original.reason || ""}
        >
          {row.original.reason || "—"}
        </div>
      ),
    },
    {
      id: "linked_payment",
      header: "رقم الدفعة المرتبطة",
      accessorFn: (row) => row.linked_payment?.payments_number ?? "",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.linked_payment?.payments_number ?? "—"}
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
        <ContractPaymentPenaltyActionsCell
          penalty={row.original}
          onRefresh={onRefresh}
        />
      ),
    },
  ];
}
