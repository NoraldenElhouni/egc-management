// components/tables/columns/operations/contracts/paymentRequestsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { StatusBadge } from "../../../../ui/Badge";
import { PaymentRequest } from "../../../../../hooks/operations/contracts/useContracts";

const paymentStatusBadge = (status: PaymentRequest["status"]) => {
  switch (status) {
    case "paid":
      return <StatusBadge.Paid />;
    case "approved":
      return <StatusBadge.Awarded />;
    case "declined":
      return <StatusBadge.Rejected />;
    default:
      return <StatusBadge.Pending />;
  }
};

const paymentMethodLabel: Record<string, string> = {
  cash: "نقداً",
  bank: "تحويل بنكي",
  cheque: "شيك",
};

export const PaymentRequestsColumns: ColumnDef<PaymentRequest>[] = [
  {
    id: "serial",
    header: "رقم الطلب",
    cell: ({ row }) => (
      <span className="text-gray-400 font-mono text-sm">
        #{String(row.index + 1).padStart(3, "0")}
      </span>
    ),
    size: 80,
  },
  {
    id: "milestone",
    header: "المرحلة",
    accessorFn: (row) => row.contract_milestones.title,
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ getValue }) => (
      <span className="font-medium">{formatCurrency(getValue<number>())}</span>
    ),
  },
  {
    id: "requested_by",
    header: "طلب بواسطة",
    accessorFn: (row) =>
      `${row.employees.first_name} ${row.employees.last_name ?? ""}`,
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ getValue }) =>
      paymentStatusBadge(getValue<PaymentRequest["status"]>()),
  },
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    cell: ({ getValue }) => (
      <span className="text-gray-600 text-sm">
        {paymentMethodLabel[getValue<string>()] ?? getValue<string>() ?? "—"}
      </span>
    ),
  },
];
