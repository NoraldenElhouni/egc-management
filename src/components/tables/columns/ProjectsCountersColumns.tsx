import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import {
  AccountNegativePeriod,
  NegativePeriod,
} from "../../../hooks/projects/useProjectCounters";
import { formatCurrency, formatDate } from "../../../utils/helpper";
import Badge from "../../ui/Badge";

export interface ProjectCounterSummaryRow {
  id: string;
  name: string;
  serialNumber: number | null;
  minusRow?: NegativePeriod;
  accountMinusRows: AccountNegativePeriod[];
}

export const projectsCountersColumns: ColumnDef<ProjectCounterSummaryRow>[] = [
  {
    accessorKey: "serialNumber",
    header: "الرقم",
    size: 32,
  },
  {
    accessorKey: "name",
    header: "المشروع",
    cell: ({ row }) => (
      <Link
        to={`/projects/${row.original.id}/counters`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "status",
    header: "الحالة",
    accessorFn: (row) => (row.minusRow ? "in_minus" : "normal"),
    cell: ({ row }) =>
      row.original.minusRow ? (
        <Badge label="رصيد سالب" variant="danger" dot />
      ) : (
        <Badge label="طبيعي" variant="success" dot />
      ),
  },
  {
    id: "account_status",
    header: "حالة الحساب",
    accessorFn: (row) => row.accountMinusRows.length,
    cell: ({ row }) => {
      const accountMinusRows = row.original.accountMinusRows;
      const count = accountMinusRows.length;
      if (count === 0) return <Badge label="طبيعي" variant="success" dot />;

      const days = accountMinusRows.reduce(
        (max, r) => Math.max(max, r.days_count ?? 0),
        0,
      );
      return <Badge label={`رصيد سالب  ${days} يوم`} variant="danger" dot />;
    },
  },
  {
    id: "started_on",
    header: "بدأ الرصيد السالب في",
    accessorFn: (row) => row.minusRow?.started_on ?? "",
    cell: ({ row }) =>
      row.original.minusRow
        ? formatDate(row.original.minusRow.started_on)
        : "—",
  },
  {
    id: "days_in_minus",
    header: "عدد الأيام",
    accessorFn: (row) => row.minusRow?.days_count ?? 0,
    cell: ({ row }) => row.original.minusRow?.days_count ?? "—",
  },
  {
    id: "min_balance",
    header: "أقل رصيد",
    accessorFn: (row) => row.minusRow?.min_balance ?? 0,
    cell: ({ row }) => {
      const minusRow = row.original.minusRow;
      return minusRow && minusRow.min_balance !== null
        ? formatCurrency(minusRow.min_balance, minusRow.currency ?? "LYD")
        : "—";
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/projects/${row.original.id}/counters`}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        عرض العدادات
      </Link>
    ),
  },
];
