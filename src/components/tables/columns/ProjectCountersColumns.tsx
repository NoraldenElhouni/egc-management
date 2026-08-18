import { ColumnDef } from "@tanstack/react-table";
import { NegativePeriod } from "../../../hooks/projects/useProjectCounters";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import Badge from "../../ui/Badge";

export const projectCountersColumns: ColumnDef<NegativePeriod>[] = [
  {
    accessorKey: "started_on",
    header: "تاريخ البداية",
    cell: ({ row }) => formatDate(row.original.started_on),
  },
  {
    accessorKey: "ended_on",
    header: "تاريخ النهاية",
    cell: ({ row }) =>
      row.original.ended_on ? formatDate(row.original.ended_on) : "—",
  },
  {
    accessorKey: "days_count",
    header: "عدد الأيام",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.days_count}</span>
    ),
  },
  {
    accessorKey: "min_balance",
    header: "أقل رصيد",
    cell: ({ row }) => {
      const { min_balance, currency } = row.original;
      return (
        <span className="font-medium">
          {min_balance !== null ? formatCurrency(min_balance, currency) : "—"}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "الحالة",
    accessorFn: (row) => (row.ended_on ? "closed" : "open"),
    cell: ({ row }) =>
      row.original.ended_on ? (
        <Badge label="منتهي" variant="default" />
      ) : (
        <Badge label="مستمر" variant="warning" dot />
      ),
  },
];
