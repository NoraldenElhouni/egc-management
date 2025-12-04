import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Projects } from "../../../types/global.type";
import { statusColor } from "../../../utils/colors/status";
import { formatCurrency } from "../../../utils/helpper";
import { FullProject } from "../../../types/extended.type";

// Convert to a function that accepts the link path builder and version
export const createProjectsColumns = (
  getLinkPath: (id: string | number) => string,
  version = "default"
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

    {
      accessorKey: "code",
      header: "الكود",
    },

    {
      accessorKey: "percentage",
      header: "الحصه المشروع مع نسبة",
      cell: ({ row }) => {
        const data = row.original.project_percentage;
        const lydItem = data.find((item) => item.currency === "LYD");

        return (
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">
              {formatCurrency(lydItem?.total_percentage ?? 0, "LYD")}
            </div>
            <div className="text-xs text-gray-500">{lydItem?.percentage}%</div>
          </div>
        );
      },
    },
    {
      accessorKey: "project_balances",
      header: "قيمة المشروع",
      cell: ({ row }) => {
        const balances = row.original.project_balances;
        const lydBalance = balances.find(
          (balance) => balance.currency === "LYD"
        );

        return lydBalance ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${lydBalance.balance < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(lydBalance?.balance ?? 0, "LYD")}
            </div>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "project_balances.held",
      header: "قيمة المحتجز",
      cell: ({ row }) => {
        const balances = row.original.project_balances;
        const lydBalance = balances.find(
          (balance) => balance.currency === "LYD"
        );

        return lydBalance ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${lydBalance.held < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(lydBalance?.held ?? 0, "LYD")}
            </div>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "project_balances.total_transactions",
      header: "اجمالي ايداع",
      cell: ({ row }) => {
        const balances = row.original.project_balances;
        const lydBalance = balances.find(
          (balance) => balance.currency === "LYD"
        );

        return lydBalance ? (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-medium ${lydBalance.total_transactions < 0 ? "text-red-600" : ""}`}
            >
              {formatCurrency(lydBalance?.total_transactions ?? 0, "LYD")}
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

    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString("ar-LY");
      },
    },
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
    // Show only essential columns for compact view
    return allColumns.filter((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = col.id || (col as any).accessorKey;
      return [
        "select",
        "serial_number",
        "name",
        "percentage",
        "project_balances",
        "project_balances.held",
        "project_balances.total_transactions",
        "status",
      ].includes(key);
    });
  }

  if (version === "minimal") {
    // Show minimal columns
    return allColumns.filter((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = col.id || (col as any).accessorKey;
      return ["serial_number", "name", "code"].includes(key);
    });
  }

  // Default: return all columns
  return allColumns;
};
