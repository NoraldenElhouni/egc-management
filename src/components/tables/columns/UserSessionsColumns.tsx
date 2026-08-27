import { ColumnDef } from "@tanstack/react-table";
import { UserSessionRow } from "../../../hooks/settings/useUserSessions";
import { formatRelativeTime } from "../../../utils/helpper";

export const UserSessionsColumns: ColumnDef<UserSessionRow>[] = [
  {
    accessorKey: "user_name",
    header: "المستخدم",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">
          {row.original.user_name}
        </div>
        <div className="text-xs text-gray-500">{row.original.user_email}</div>
      </div>
    ),
  },
  {
    accessorKey: "app_label",
    header: "التطبيق",
  },
  {
    accessorKey: "platform_label",
    header: "النظام",
    cell: ({ row }) => (
      <span>
        {row.original.platform_label}
        {row.original.os_version ? ` ${row.original.os_version}` : ""}
      </span>
    ),
  },
  {
    accessorKey: "app_version",
    header: "الإصدار",
    cell: ({ row }) => (
      <span className="font-mono text-xs">v{row.original.app_version}</span>
    ),
  },
  {
    accessorKey: "is_online",
    header: "الحالة",
    cell: ({ row }) =>
      row.original.is_online ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          متصل الآن
        </span>
      ) : (
        <span className="text-xs text-gray-500">غير متصل</span>
      ),
  },
  {
    accessorKey: "last_seen_at",
    header: "آخر ظهور",
    cell: ({ row }) => formatRelativeTime(row.original.last_seen_at),
  },
];
