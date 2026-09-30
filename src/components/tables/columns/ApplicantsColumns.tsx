import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import Badge, { BadgeVariant } from "../../ui/Badge";
import type { ApplicantWithScore } from "../../../hooks/hr/useApplicants";
import {
  applicationStatusLabel,
  experienceLevelLabel,
} from "../../../types/hr.type";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  applied: "info",
  interviewing: "warning",
  waitlisted: "purple",
  hired: "success",
  rejected: "danger",
  withdrawn: "default",
};

export const ApplicantsColumns: ColumnDef<ApplicantWithScore>[] = [
  {
    accessorKey: "full_name",
    header: "الاسم",
    cell: ({ row }) => (
      <Link
        to={`/hr/applicants/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.full_name}
      </Link>
    ),
  },
  {
    accessorKey: "applied_position",
    header: "الوظيفة المتقدم عليها",
    cell: ({ row }) => row.original.applied_position ?? "—",
  },
  {
    accessorKey: "phone_whatsapp",
    header: "الهاتف",
    cell: ({ row }) => row.original.phone_whatsapp ?? "—",
  },
  {
    accessorKey: "experience_level",
    header: "الخبرة",
    cell: ({ row }) => experienceLevelLabel(row.original.experience_level),
  },
  {
    accessorKey: "total_score",
    header: "الدرجة الكلية",
    cell: ({ row }) =>
      row.original.total_score === null ? (
        "—"
      ) : (
        <Badge label={String(row.original.total_score)} variant="info" />
      ),
    sortingFn: (a, b) =>
      (a.original.total_score ?? -1) - (b.original.total_score ?? -1),
  },
  {
    accessorKey: "application_status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge
        label={applicationStatusLabel(row.original.application_status)}
        variant={STATUS_VARIANT[row.original.application_status] ?? "default"}
        dot
      />
    ),
  },
  {
    accessorKey: "created_at",
    header: "تاريخ التقديم",
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString("ar-LY"),
  },
];
