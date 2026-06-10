// components/tables/columns/operations/contracts/milestoneReportsColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { Link } from "react-router-dom";
import { MilestoneReportsWithEmployee } from "../../../../../types/extended.type";

export const MilestoneReportsColumns: ColumnDef<MilestoneReportsWithEmployee>[] =
  [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="text-gray-400 text-sm">{row.index + 1}</span>
      ),
      size: 40,
    },
    {
      accessorKey: "description",
      header: "الوصف",
      cell: ({ getValue }) => (
        <span className="text-gray-700 text-sm">
          {getValue<string>() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "amount_done",
      header: "المنجز",
      cell: ({ getValue }) => {
        const val = getValue<number | null>();
        return (
          <span className="font-medium">
            {val !== null ? formatCurrency(val) : "—"}
          </span>
        );
      },
    },
    {
      id: "submitted_by",
      header: "رُفع بواسطة",
      accessorFn: (row) =>
        `${row.employees.first_name} ${row.employees.last_name ?? ""}`,
      cell: ({ getValue }) => (
        <span className="text-gray-700">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الرفع",
      cell: ({ getValue }) => (
        <span className="text-gray-500 text-sm">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "img_path",
      header: "صورة",
      cell: ({ getValue }) => {
        const path = getValue<string | null>();
        return path ? (
          <Link
            to={path}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 text-sm underline"
          >
            عرض
          </Link>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        );
      },
    },
  ];
