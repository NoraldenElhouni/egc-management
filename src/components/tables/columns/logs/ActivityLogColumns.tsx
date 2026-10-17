import { ColumnDef } from "@tanstack/react-table";
import type { LogEvent } from "../../../../types/logs.types";
import {
  amountOf,
  changesOf,
  formatDateTime,
  sourceLabel,
  subjectOf,
  toneOf,
} from "../../../logs/logFormat";

const toneText = {
  positive: "text-emerald-700",
  negative: "text-red-700",
  neutral: "text-gray-900",
} as const;

/**
 * Columns for the activity log. `onActorClick` narrows the page to one
 * person's actions; omit it where the table is not filterable.
 */
export const getActivityLogColumns = (
  onActorClick?: (actorId: string, actorName: string) => void,
): ColumnDef<LogEvent>[] => [
  {
    accessorKey: "occurred_at",
    header: "الوقت",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {formatDateTime(row.original.occurred_at)}
      </span>
    ),
  },
  {
    accessorKey: "log_label",
    header: "السجل",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-gray-600">
        {row.original.log_label ?? row.original.log_name}
      </span>
    ),
  },
  {
    // The accessor is what the search bar matches: action and both values.
    id: "action",
    accessorFn: (e) => [e.action_label, e.from_label, e.to_label].filter(Boolean).join(" "),
    header: "الحدث",
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="min-w-[10rem]">
          <p className={`text-sm font-semibold ${toneText[toneOf(e.action)]}`}>{e.action_label}</p>
          {(e.from_label || e.to_label) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {e.from_label ?? "—"} ← {e.to_label ?? "—"}
            </p>
          )}
        </div>
      );
    },
  },
  {
    id: "subject",
    accessorFn: (e) =>
      [subjectOf(e), e.project_name, e.reason, ...changesOf(e).map((c) => c.label)]
        .filter(Boolean)
        .join(" "),
    header: "التفاصيل",
    cell: ({ row }) => {
      const e = row.original;
      const changes = changesOf(e);
      return (
        <div className="min-w-[14rem] max-w-md text-xs">
          <p className="text-gray-800">{subjectOf(e)}</p>
          {e.project_name && e.log_name !== "project_status" && (
            <p className="text-gray-400">{e.project_name}</p>
          )}
          {e.reason && <p className="mt-1 text-amber-800">السبب: {e.reason}</p>}
          {changes.slice(0, 3).map((c) => (
            <p key={c.field} className="text-gray-500">
              {c.label}: {c.before} ← {c.after}
            </p>
          ))}
          {changes.length > 3 && <p className="text-gray-400">+{changes.length - 3}</p>}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-gray-800">{amountOf(row.original) ?? "—"}</span>
    ),
  },
  {
    id: "actor",
    accessorFn: (e) => e.actor_name ?? sourceLabel(e.source) ?? "",
    header: "بواسطة",
    cell: ({ row }) => {
      const e = row.original;
      const source = sourceLabel(e.source);
      if (!e.actor_name) {
        return <span className="text-xs text-gray-400">{source ?? "غير معروف"}</span>;
      }
      return onActorClick && e.actor_id ? (
        <button
          type="button"
          className="text-xs text-primary hover:underline whitespace-nowrap"
          title="عرض كل ما قام به"
          onClick={() => onActorClick(e.actor_id as string, e.actor_name as string)}
        >
          {e.actor_name}
        </button>
      ) : (
        <span className="text-xs text-gray-700 whitespace-nowrap">{e.actor_name}</span>
      );
    },
  },
];
