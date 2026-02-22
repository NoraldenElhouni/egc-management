import { ColumnDef } from "@tanstack/react-table";
import { projectExpensePayments } from "../../../types/extended.type";
import { translatePaymentMethod } from "../../../utils/translations";
import Button from "../../ui/Button";

type ColumnsProps = {
  onEdit?: (p: projectExpensePayments) => void;
  onDelete?: (p: projectExpensePayments) => void;
  loading?: boolean;
};

export const ExpensePaymentsColumns = ({
  onEdit,
  onDelete,
  loading,
}: ColumnsProps = {}): ColumnDef<projectExpensePayments>[] => [
  // SELECT CHECKBOX
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
          onClick={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    size: 32,
  },

  // SERIAL NUMBER
  {
    accessorKey: "serial_number",
    header: "الرقم",
    cell: ({ row }) => row.original.serial_number ?? "-",
    size: 32,
  },

  // AMOUNT
  {
    accessorKey: "amount",
    header: "القيمة",
    cell: ({ row }) => {
      const currency = row.original.accounts?.currency || "";
      return `${currency} ${row.original.amount}`;
    },
  },

  // PAYMENT METHOD
  {
    accessorKey: "payment_method",
    header: "طريقة الدفع",
    cell: ({ row }) => {
      const pm = row.original.payment_method;
      if (pm === "cash" || pm === "bank") {
        return translatePaymentMethod(pm);
      }
      return "-";
    },
  },

  // USER FULL NAME (first + last) — searchable via accessorFn
  {
    id: "user_name",
    accessorFn: (row: projectExpensePayments) =>
      `${row.users?.first_name ?? ""} ${row.users?.last_name ?? ""}`.trim(),
    header: "تم الدفع بواسطة",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value || "-";
    },
  },

  // CREATED DATE
  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },

  // ✅ EDIT BUTTON
  {
    id: "actions",
    header: "إجراء",
    enableSorting: false,
    cell: ({ row }) => {
      if (!onEdit && !onDelete) return "-";

      return (
        <div className="flex gap-2">
          {onEdit && (
            <Button
              type="button"
              variant="primary-light"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
            >
              تعديل
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="error"
              size="sm"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(row.original);
              }}
            >
              {loading ? "جاري الحذف..." : "حذف"}
            </Button>
          )}
        </div>
      );
    },
  },
];
