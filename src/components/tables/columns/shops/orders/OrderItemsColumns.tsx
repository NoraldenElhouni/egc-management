import { ColumnDef } from "@tanstack/react-table";
import { OrderDetails } from "../../../../../hooks/shop/orders/useOrderDetails";
import { formatCurrency } from "../../../../../utils/helpper";

type OrderItem = OrderDetails["items"][number];

export const OrderItemsColumns: ColumnDef<OrderItem>[] = [
  {
    accessorKey: "name",
    header: "المنتج",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-800">
          {row.original.name ?? "منتج"}
        </p>
        {row.original.notes && (
          <p className="text-xs text-gray-400 mt-0.5">{row.original.notes}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "الكمية",
    cell: ({ row }) => <span>{row.original.quantity}</span>,
  },
  {
    accessorKey: "quoted_unit_price",
    header: "سعر الوحدة",
    cell: ({ row }) => {
      const v = row.original.quoted_unit_price;
      return <span>{v != null ? formatCurrency(v) : "—"}</span>;
    },
  },
  {
    accessorKey: "quoted_total",
    header: "الإجمالي",
    cell: ({ row }) => {
      const v = row.original.quoted_total;
      return (
        <span className="font-medium">
          {v != null ? formatCurrency(v) : "—"}
        </span>
      );
    },
  },
];
