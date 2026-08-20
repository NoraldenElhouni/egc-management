import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Award as AwardIcon } from "lucide-react";
import { QuoteRow } from "../../../../../hooks/operations/contracts/rounds/useQuotes";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import Button from "../../../../ui/Button";

export function getQuotesColumns(
  onAward: (quote: QuoteRow) => void,
): ColumnDef<QuoteRow>[] {
  return [
    {
      id: "contractor",
      header: "المقاول",
      accessorFn: (row) =>
        `${row.contractor?.first_name ?? ""} ${row.contractor?.last_name ?? ""}`,
      cell: ({ row }) => (
        <Link
          to={`quotes/${row.original.id}`}
          className="font-medium hover:text-blue-600 transition-colors"
        >
          {row.original.contractor?.first_name ?? "—"}{" "}
          {row.original.contractor?.last_name ?? ""}
        </Link>
      ),
    },
    {
      accessorKey: "total",
      header: "الإجمالي",
      cell: ({ getValue }) => (
        <span className="font-semibold">
          {formatCurrency(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: "days_needed",
      header: "المدة",
      cell: ({ getValue }) => {
        const value = getValue<number | null>();
        return <span>{value != null ? `${value} يوم` : "—"}</span>;
      },
    },
    {
      id: "items_count",
      header: "عدد البنود",
      accessorFn: (row) => row.quote_items.length,
      cell: ({ getValue }) => (
        <span className="text-gray-700">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ التقديم",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to={`quotes/${row.original.id}`}>
            <Button size="xs" variant="primary-outline">
              إدخال الأسعار
            </Button>
          </Link>
          <Button
            size="xs"
            variant="success"
            onClick={() => onAward(row.original)}
          >
            <AwardIcon className="w-3.5 h-3.5 ml-1" />
            ترسية
          </Button>
        </div>
      ),
    },
  ];
}
