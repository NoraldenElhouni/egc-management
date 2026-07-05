import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Orders } from "../../../../../types/global.type";
import { formatDate, formatCurrency } from "../../../../../utils/helpper";
import { statusLabel, statusStyle } from "../../../../../utils/orderStatus";

export const getOrdersColumns = (): ColumnDef<Orders>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          checked={table.getIsAllPageRowsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label={`Select row ${row.index + 1}`}
          onChange={row.getToggleSelectedHandler()}
          checked={row.getIsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    size: 32,
  },

  {
    accessorKey: "id",
    header: "رقم الطلب",
    cell: ({ row }) => (
      <Link to={`./${row.original.id}`} className="font-medium hover:underline">
        #{row.original.id.slice(0, 8)}
      </Link>
    ),
  },

  {
    accessorKey: "status",
    header: "الحالة",
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
    accessorKey: "vendor_ref",
    header: "المورد",
    cell: ({ row }) => <span>{row.original.vendor_ref || "—"}</span>,
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
    cell: ({ row }) => <span>{formatDate(row.original.created_at)}</span>,
  },

  {
    accessorKey: "note",
    header: "ملاحظات",
    cell: ({ row }) => (
      <span className="text-gray-500 text-sm line-clamp-1">
        {row.original.note || "—"}
      </span>
    ),
  },
];
