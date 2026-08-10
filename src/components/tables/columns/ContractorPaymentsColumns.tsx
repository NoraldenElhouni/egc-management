import { ColumnDef } from "@tanstack/react-table";
import { ContractPayment } from "../../../types/contracts.type";
import { formatDate } from "../../../utils/helpper";
import { translatePaymentMethod, translateStatus } from "../../../utils/translations";
import { statusColor } from "../../../utils/colors/status";
import ContractPaymentActionsCell from "../actions/payments/ContractPaymentActionsCell";

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v || 0));

export function getContractorPaymentsColumns(
  onRefresh?: () => void,
): ColumnDef<ContractPayment>[] {
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
      accessorKey: "payments_number",
      header: "رقم الدفعة",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ getValue }) => (
        <span className="font-medium whitespace-nowrap">
          {toNum(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "penalty_amount",
      header: "مبلغ الجزاء",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">
          {toNum(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "insurance_percentage",
      header: "نسبة التأمين",
      cell: ({ getValue }) => <span>{toNum(getValue())}%</span>,
    },
    {
      id: "insurance_amount",
      header: "مبلغ التأمين",
      accessorFn: (row) =>
        (toNum(row.amount) * toNum(row.insurance_percentage)) / 100,
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap">
          {getValue<number>().toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "grand_total",
      header: "الإجمالي الكلي",
      cell: ({ getValue }) => (
        <span className="font-semibold whitespace-nowrap">
          {toNum(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "currency",
      header: "العملة",
      cell: ({ getValue }) => <span>{getValue<string>()}</span>,
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
