import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import Badge, { BadgeVariant } from "../../ui/Badge";
import type { Applicant } from "../../../types/hr.type";
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

export const ApplicantsColumns: ColumnDef<Applicant>[] = [
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
