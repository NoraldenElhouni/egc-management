import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import { StatusBadge } from "../../../../ui/Badge";
import Button from "../../../../ui/Button";
import { Pencil } from "lucide-react";
import { ContractMilestoneRow } from "../../../../../hooks/operations/contracts/useContracts";

const milestoneStatusBadge = (status: ContractMilestoneRow["status"]) => {
  switch (status) {
    case "done":
      return <StatusBadge.Completed />;
    case "in_progress":
      return <StatusBadge.Active />;
    default:
      return <StatusBadge.Pending />;
  }
};

export const MilestonesColumns: ColumnDef<ContractMilestoneRow>[] = [
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
        <Link
          to={`milestones/${row.original.id}`}
          className="font-semibold text-gray-900 hover:underline hover:text-blue-600"
        >
          {getValue<string>()}
        </Link>
        {row.original.description && (
          <p className="text-xs text-gray-400 mt-0.5">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "percentage",
    header: "النسبة",
    cell: ({ getValue }) => (
      <span className="text-gray-600 text-sm">{getValue<number>()}%</span>
    ),
    size: 90,
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
      milestoneStatusBadge(getValue<ContractMilestoneRow["status"]>()),
  },
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Link to={`milestones/${row.original.id}/edit`}>
          <Button size="sm" variant="primary-outline">
            <Pencil className="w-3 h-3 ml-1" />
            تعديل
          </Button>
        </Link>
      </div>
    ),
  },
];
