import { ColumnDef } from "@tanstack/react-table";
import { ProjectIncome } from "../../../types/global.type";
import {
  translateFundSource,
  translatePaymentMethod,
} from "../../../utils/translations";
import { formatCurrency } from "../../../utils/helpper";
import { IncomeActionsDialog } from "../actions/income/IncomeActionsDialog";

export const ProjectsIncomeColumns: ColumnDef<ProjectIncome>[] = [
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
    accessorKey: "client_name",
    accessorFn: (row) => row.client_name || "N/A",
    header: "اسم العميل",
  },
  {
    accessorKey: "fund",
    header: "مصدر التمويل",
    cell: ({ row }) => {
      const fundColors = {
        client: "bg-blue-100 text-blue-800",
        internal: "bg-green-100 text-green-800",
        sale: "bg-purple-100 text-purple-800",
        refund: "bg-orange-100 text-orange-800",
        other: "bg-gray-100 text-gray-800",
      };

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            fundColors[row.original.fund]
          }`}
        >
          {translateFundSource(row.original.fund)}
        </span>
      );
    },
    size: 120,
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

  {
    accessorKey: "related_expense",
    header: "مصروف مرتبط",
    cell: ({ row }) => (
      <div>
        {row.original.related_expense ? (
          <div className="font-mono">
            {row.original.related_expense.slice(0, 8)}...
          </div>
        ) : (
          "N/A"
        )}
      </div>
    ),
    size: 140,
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <IncomeActionsDialog
        incomeId={row.original.id}
        projectId={row.original.project_id}
      />
    ),
  },
];
