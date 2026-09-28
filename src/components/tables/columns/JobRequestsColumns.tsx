import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import Badge, { BadgeVariant } from "../../ui/Badge";
import type { JobRequest } from "../../../types/hr.type";
import { jobRequestStatusLabel } from "../../../types/hr.type";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: "default",
  open: "success",
  closed: "warning",
  filled: "info",
  cancelled: "danger",
};

export const JobRequestsColumns: ColumnDef<JobRequest>[] = [
  {
    accessorKey: "position_title",
    header: "مسمى الوظيفة",
    cell: ({ row }) => (
      <Link
        to={`/hr/job-requests/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.position_title}
      </Link>
    ),
  },
  {
    accessorKey: "department",
    header: "القسم",
    cell: ({ row }) => row.original.department ?? "—",
  },
  {
    accessorKey: "positions_count",
    header: "عدد الشواغر",
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge
        label={jobRequestStatusLabel(row.original.status)}
        variant={STATUS_VARIANT[row.original.status] ?? "default"}
        dot
      />
    ),
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الطلب",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString("ar-LY"),
  },
];
