import { ColumnDef } from "@tanstack/react-table";
import { ProjectRefund } from "../../../types/global.type";
import { translatePaymentMethod } from "../../../utils/translations";
import { formatCurrency } from "../../../utils/helpper";

export const ProjectsRefundColumns: ColumnDef<ProjectRefund>[] = [
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
    accessorKey: "serial_number",
    header: "الرقم",
    size: 32,
  },
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => (
      <div
        className="max-w-[200px] truncate"
        title={row.original.description || ""}
      >
        {row.original.description || "N/A"}
      </div>
    ),
    size: 300,
  },

  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => (
      <div className="font-medium text-green-700">
        {formatCurrency(row.original.amount, "LYD")}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    cell: ({ row }) => (
      <span>{translatePaymentMethod(row.original.payment_method)}</span>
    ),
    size: 120,
  },
  {
    accessorKey: "income_date",
    header: "التاريخ",
    cell: ({ row }) => (
      <div>{new Date(row.original.income_date).toLocaleDateString()}</div>
    ),
    size: 100,
  },
];
