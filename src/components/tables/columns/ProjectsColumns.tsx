import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Projects } from "../../../types/global.type";
import { statusColor } from "../../../utils/colors/status";
import { formatCurrency } from "../../../utils/helpper";
import { FullProject } from "../../../types/extended.type";

// Convert to a function that accepts the link path builder and version
export const createProjectsColumns = (
  getLinkPath: (id: string | number) => string,
  version = "default",
): ColumnDef<FullProject>[] => {
  const allColumns: ColumnDef<FullProject>[] = [
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
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => (
        <Link
          to={getLinkPath(row.original.id)}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },

    // {
    //   accessorKey: "code",
    //   header: "الكود",
    // },

    {
      accessorKey: "percentage",
      header: "احمالي النسية",
      cell: ({ row }) => {
        const data = row.original.project_percentage;
        const accounts = row.original.accounts;
        const lydItem = data.find((item) => item.currency === "LYD");
        const lydItems = accounts?.filter(
          (account) => account.currency === "LYD",
        );
        const totalPercentage =
          lydItems?.reduce(
            (sum, item) => sum + (item.total_percentage ?? 0),
            0,
          ) || 0;

        return (
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">
              {formatCurrency(totalPercentage, "LYD")}
            </div>
            <div className="text-xs text-gray-500">{lydItem?.percentage}%</div>
          </div>
        );
      },
    },
    {
      accessorKey: "expenses",
      header: "اجمالي المصاريف",
      cell: ({ row }) => {
        const accounts = row.original.accounts;
        const lydItems = accounts?.filter(
          (account) => account.currency === "LYD",
        );
        const totalExpense =
          lydItems?.reduce((sum, item) => sum + (item.total_expense ?? 0), 0) ||
          0;

        return totalExpense ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${totalExpense < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(totalExpense, "LYD")}
            </div>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "income",
      header: "اجمالي الايرادات",
      cell: ({ row }) => {
        const accounts = row.original.accounts;
        const lydItems = accounts?.filter(
          (account) => account.currency === "LYD",
        );
        const totalIncome =
          lydItems?.reduce(
            (sum, item) => sum + (item.total_transactions ?? 0),
            0,
          ) || 0;

        return totalIncome ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${totalIncome < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(totalIncome, "LYD")}
            </div>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "balance",
      header: "الرصيد الحالي",
      cell: ({ row }) => {
        const accounts = row.original.accounts;
        const lydItems = accounts?.filter(
          (account) => account.currency === "LYD",
        );
        const totalBalance =
          lydItems?.reduce((sum, item) => sum + (item.balance ?? 0), 0) || 0;

        return totalBalance ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${totalBalance < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(totalBalance, "LYD")}
            </div>
          </div>
        ) : (
          "—"
        );
      },
    },

    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const statusMap: Record<Projects["status"], string> = {
          active: "نشط",
          paused: "متوقف",
          completed: "مكتمل",
          cancelled: "ملغي",
        };
        const statusColorClass = statusColor(row.original.status);
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}
          >
            {statusMap[row.original.status]}
          </span>
        );
      },
    },

    {
      accessorKey: "address",
      header: "العنوان",
      cell: ({ row }) => row.original.address ?? "—",
    },

    // {
    //   accessorKey: "created_at",
    //   header: "تاريخ الإنشاء",
    //   cell: ({ row }) => {
    //     const date = new Date(row.original.created_at);
    //     return date.toLocaleDateString("ar-LY");
    //   },
    // },
  ];

  // Filter columns based on version
  if (version === "compact") {
    // Show only essential columns for compact view
    return allColumns.filter((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = col.id || (col as any).accessorKey;
      return ["select", "serial_number", "name", "status"].includes(key);
    });
  }
  if (version === "finance") {
    // Show only essential columns for finance view
    return allColumns.filter((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = col.id || (col as any).accessorKey;
      return [
        "select",
        "serial_number",
        "name",
        "percentage",
        "expenses",
        "income",
        "balance",
        "status",
      ].includes(key);
    });
  }

  if (version === "minimal") {
    // Show minimal columns
    return allColumns.filter((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = col.id || (col as any).accessorKey;
      return ["serial_number", "name"].includes(key);
    });
  }

  // Default: return all columns
  return allColumns;
};
