// components/tables/columns/operations/contracts/paymentRequestsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { StatusBadge } from "../../../../ui/Badge";
import { RequestPaymentRow } from "../../../../../hooks/operations/contracts/usePayments";

const paymentStatusBadge = (status: RequestPaymentRow["status"]) => {
  switch (status) {
    case "paid":
      return <StatusBadge.Paid />;
    case "approved":
      return <StatusBadge.Awarded />;
    case "rejected":
      return <StatusBadge.Rejected />;
    default:
      return <StatusBadge.Pending />;
  }
};

const paymentMethodLabel: Record<string, string> = {
  cash: "نقداً",
  bank: "تحويل بنكي",
};

export const PaymentRequestsColumns: ColumnDef<RequestPaymentRow>[] = [
  {
    id: "serial",
    header: "رقم الطلب",
    cell: ({ row }) => (
      <span className="text-gray-400 font-mono text-sm">
        #
        {String(row.original.serial_number ?? row.index + 1).padStart(
          3,
          "0",
        )}
      </span>
    ),
    size: 80,
  },
  {
    id: "milestones",
    header: "المراحل",
    cell: ({ row }) => {
      const milestones = row.original.payment_milestones;
      if (milestones.length === 0) {
        return <span className="text-gray-300 text-sm">—</span>;
      }
      if (milestones.length === 1) {
        return (
          <span className="text-gray-700 text-sm">
            {milestones[0].milestones?.title ?? "—"}
          </span>
        );
      }
      const titles = milestones
        .map((m) => m.milestones?.title)
        .filter(Boolean)
        .join("، ");
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          title={titles}
        >
          {milestones.length} مراحل
        </span>
      );
    },
  },
  {
    id: "amount",
    header: "المبلغ",
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.original.grand_total ?? row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "penalty_amount",
    header: "الغرامات",
    cell: ({ getValue }) => {
      const val = getValue<number>();
      return val > 0 ? (
        <span className="text-red-600 font-medium">
          -{formatCurrency(val)}
        </span>
      ) : (
        <span className="text-gray-300 text-sm">—</span>
      );
    },
  },
  {
    id: "requested_by",
    header: "طلب بواسطة",
    cell: ({ row }) => {
      const requester = row.original.requester;
      return (
        <span className="text-gray-700">
          {requester
            ? `${requester.first_name} ${requester.last_name ?? ""}`
            : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الطلب",
    cell: ({ getValue }) => (
      <span className="text-gray-500 text-sm">
        {formatDate(getValue<string>())}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ getValue }) =>
      paymentStatusBadge(getValue<RequestPaymentRow["status"]>()),
  },
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return (
        <span className="text-gray-600 text-sm">
          {val ? (paymentMethodLabel[val] ?? val) : "—"}
        </span>
      );
    },
  },
];
