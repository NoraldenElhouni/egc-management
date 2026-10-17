import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Separator from "../ui/separator";
import Button from "../ui/Button";
import { formatRelativeTime } from "../../utils/helpper";
import { useCanViewLogs, useHistory } from "../../hooks/logs/useActivityLog";
import type { HistoryRefType, LogEvent } from "../../types/logs.types";
import {
  amountOf,
  changesOf,
  formatDateTime,
  sourceLabel,
  subjectOf,
  toneOf,
  type EventTone,
} from "./logFormat";

interface HistoryTimelineProps {
  refType: HistoryRefType;
  refId: string | undefined;
  title?: string;
  /** Show what each row is about. Off for single-record pages (an order). */
  showSubject?: boolean;
  className?: string;
}

const dotStyles: Record<EventTone, string> = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  neutral: "bg-blue-400",
};

// Rows from one transaction with the same action (a role reset revoking
// forty permissions) collapse into one line once there are this many.
const BURST_MIN = 4;

type Item =
  | { kind: "event"; event: LogEvent }
  | { kind: "burst"; key: string; events: LogEvent[] };

function groupBursts(events: LogEvent[]): Item[] {
  const items: Item[] = [];
  let run: LogEvent[] = [];
  const flush = () => {
    if (run.length >= BURST_MIN) {
      items.push({ kind: "burst", key: `${run[0].log_name}-${run[0].id}`, events: run });
    } else {
      run.forEach((event) => items.push({ kind: "event", event }));
    }
    run = [];
  };
  for (const event of events) {
    const head = run[0];
    if (head && (head.tx_id !== event.tx_id || head.log_name !== event.log_name || head.action !== event.action)) {
      flush();
    }
    run.push(event);
  }
  flush();
  return items;
}

const ValueChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
    {children}
  </span>
);

const EventRow = ({ event, showSubject, last }: { event: LogEvent; showSubject: boolean; last: boolean }) => {
  const changes = changesOf(event);
  const amount = amountOf(event);
  const source = sourceLabel(event.source);
  const tone = toneOf(event.action);

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center self-stretch">
        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotStyles[tone]}`} />
        {!last && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[1.5rem]" />}
      </div>

      <div className="pb-5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-gray-900">{event.action_label}</p>
          {(event.from_label || event.to_label) && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {event.from_label && <ValueChip>{event.from_label}</ValueChip>}
              {event.from_label && event.to_label && <span>←</span>}
              {event.to_label && <ValueChip>{event.to_label}</ValueChip>}
            </span>
          )}
          {amount && <span className="text-xs font-medium text-gray-700">{amount}</span>}
        </div>

        {showSubject && (
          <p className="text-xs text-gray-600 mt-0.5">
            {subjectOf(event)}
            {event.project_name && event.log_name !== "project_status" && (
              <span className="text-gray-400"> · {event.project_name}</span>
            )}
          </p>
        )}

        {event.reason && (
          <p className="mt-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs leading-6 text-gray-700">
            السبب: {event.reason}
          </p>
        )}

        {changes.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {changes.map((c) => (
              <li key={c.field} className="text-xs text-gray-600">
                {c.label}: <span className="text-gray-400 line-through">{c.before}</span>{" "}
                <span className="text-gray-400">←</span> <span className="text-gray-800">{c.after}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {event.actor_name ?? source ?? "غير معروف"}
          {event.actor_name && source && event.source !== "user" ? ` (${source})` : ""}
          {" · "}
          <span title={formatDateTime(event.occurred_at)}>
            {formatRelativeTime(event.occurred_at)}
          </span>
        </p>
      </div>
    </div>
  );
};

const BurstRow = ({ events, showSubject, last }: { events: LogEvent[]; showSubject: boolean; last: boolean }) => {
  const [open, setOpen] = useState(false);
  const first = events[0];
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center self-stretch">
          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotStyles[toneOf(first.action)]}`} />
          {(!last || open) && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[1.5rem]" />}
        </div>
        <div className="pb-5 flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-primary"
          >
            {first.action_label} — {events.length} {first.log_label ?? ""}
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            {first.actor_name ?? sourceLabel(first.source) ?? "غير معروف"} ·{" "}
            <span title={formatDateTime(first.occurred_at)}>{formatRelativeTime(first.occurred_at)}</span>
          </p>
        </div>
      </div>
      {open && (
        <div className="mr-7 border-r border-dashed border-gray-200 pr-3">
          {events.map((event, i) => (
            <EventRow key={`${event.log_name}-${event.id}`} event={event} showSubject={showSubject} last={i === events.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * The history of one record, read from the logging system
 * (public.get_history). Rows the user may not read are filtered by the
 * database, so a user with fewer log permissions simply sees fewer rows.
 */
const HistoryTimeline = ({
  refType,
  refId,
  title = "السجل",
  showSubject = true,
  className = "",
}: HistoryTimelineProps) => {
  const canView = useCanViewLogs();
  const { data, isPending, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useHistory(refType, refId, canView === true);

  const events = useMemo(() => data?.pages.flat() ?? [], [data]);
  const items = useMemo(() => groupBursts(events), [events]);

  let body: React.ReactNode;
  if (canView === false) {
    body = <p className="text-sm text-gray-400">ليست لديك صلاحية عرض السجل.</p>;
  } else if (canView === undefined || isPending) {
    body = <p className="text-sm text-gray-400">جاري تحميل السجل...</p>;
  } else if (isError) {
    body = <p className="text-sm text-red-600">تعذّر تحميل السجل: {(error as Error).message}</p>;
  } else if (events.length === 0) {
    body = (
      <p className="text-sm text-gray-400">
        لا توجد أحداث مسجّلة بعد. يبدأ السجل من تاريخ تفعيله.
      </p>
    );
  } else {
    body = (
      <div className="flex flex-col">
        {items.map((item, i) =>
          item.kind === "event" ? (
            <EventRow
              key={`${item.event.log_name}-${item.event.id}`}
              event={item.event}
              showSubject={showSubject}
              last={i === items.length - 1 && !hasNextPage}
            />
          ) : (
            <BurstRow key={item.key} events={item.events} showSubject={showSubject} last={i === items.length - 1 && !hasNextPage} />
          ),
        )}
        {hasNextPage && (
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              تحميل المزيد
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`} dir="rtl">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <Separator />
      <div className="mt-4">{body}</div>
    </div>
  );
};

export default HistoryTimeline;
