import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { StatusBadge } from "../../../../ui/Badge";
import Button from "../../../../ui/Button";
import { FileText, Newspaper, Pencil, Trash } from "lucide-react";
import { ContractMilestone } from "../../../../../hooks/operations/contracts/useContracts";

const milestoneStatusBadge = (status: ContractMilestone["status"]) => {
  switch (status) {
    case "completed":
      return <StatusBadge.Completed />;
    case "approved":
      return <StatusBadge.Awarded />;
    case "in_progress":
      return <StatusBadge.Active />;
    default:
      return <StatusBadge.Pending />;
  }
};

export const MilestonesColumns: ColumnDef<ContractMilestone>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.index + 1}</span>
    ),
    size: 40,
  },
  {
    accessorKey: "title",
    header: "المرحلة",
    cell: ({ getValue, row }) => (
      <div>
        <p className="font-semibold text-gray-900">{getValue<string>()}</p>
        {row.original.description && (
          <p className="text-xs text-gray-400 mt-0.5">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ getValue }) => (
      <span className="font-medium">{formatCurrency(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: "due_date",
    header: "تاريخ الاستحقاق",
    cell: ({ getValue }) => (
      <span className="text-gray-600 text-sm">
        {getValue<string>() ? formatDate(getValue<string>()) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ getValue }) =>
      milestoneStatusBadge(getValue<ContractMilestone["status"]>()),
  },
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => {
      const isPending = row.original.status === "pending";
      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary-outline">
            <FileText className="w-3.5 h-3.5 ml-1" />
            فاتورة
          </Button>
          <Button size="sm" variant="primary-outline">
            <Newspaper className="w-3.5 h-3.5 ml-1" />
            تقارير
          </Button>
          {isPending && (
            <>
              <Button size="sm" variant="primary-outline">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="error">
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
];
