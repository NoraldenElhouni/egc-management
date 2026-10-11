import { useMemo, type ReactNode } from "react";
import { AlarmClock, CheckCircle2, CircleDashed, ListChecks, ListTodo, Loader, UserX } from "lucide-react";
import type { TaskDirectoryData } from "../../../hooks/tasks/useTaskDirectory";
import type { DirectoryFilterState } from "./directoryFilters";
import { activeKpiKey, kpiFilters, type KpiKey } from "./spaceKpiFilters";

// KPI row at the top of the space view. The NUMBERS always describe the
// WHOLE space — they read data.tasks, not the search/filter-narrowed list
// below — so they don't jump around while someone is filtering.
//
// Each card is also a filter button: clicking it sets the page's filters to
// that card's preset (spaceKpiFilters.ts), so the list below shows exactly
// the tasks the number counts, under the boards that have any. The card
// that matches the current filters is highlighted; clicking it again goes
// back to the default (open tasks) view.
//
// "Open" is any status outside done/closed (same rule the board uses).
// Overdue counts tasks.is_overdue on open tasks, so the number agrees
// with the "متأخرة" filter and the red badges in the list.

interface Kpi {
  key: KpiKey;
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone: string;
  /** Draws the card in the warning colour when the value is non-zero. */
  alertWhenPositive?: boolean;
  raw: number;
  /** Tasks the card selects — decides whether clicking it can show anything. */
  count: number;
  /** Tooltip, e.g. "عرض المهام المتأخرة". */
  action: string;
}

function KpiCard({
  kpi,
  active,
  onClick,
}: {
  kpi: Kpi;
  active: boolean;
  onClick: () => void;
}) {
  const alert = kpi.alertWhenPositive && kpi.raw > 0;
  // A card with nothing behind it has nothing to show — unless it is the
  // active one, which must stay clickable so it can be switched off.
  const disabled = kpi.count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={disabled ? undefined : active ? "إلغاء التصفية" : kpi.action}
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2.5 text-right shadow-sm transition ${
        alert && !active ? "border-red-200" : "border-gray-100"
      } ${disabled ? "cursor-default opacity-70" : "cursor-pointer hover:shadow-md"}`}
      style={active ? { borderColor: kpi.tone, boxShadow: `0 0 0 1px ${kpi.tone}`, background: `${kpi.tone}0D` } : undefined}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${kpi.tone}1A`, color: kpi.tone }}
      >
        {kpi.icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-tight text-gray-900" style={alert ? { color: kpi.tone } : undefined}>
          {kpi.value}
        </div>
        <div className="truncate text-xs text-gray-500">{kpi.label}</div>
        {kpi.hint && <div className="truncate text-xs text-gray-400">{kpi.hint}</div>}
      </div>
    </button>
  );
}

export default function SpaceKpiStrip({
  data,
  filters,
  onSelect,
}: {
  data: TaskDirectoryData;
  /** The page's current filters — decides which card is highlighted. */
  filters: DirectoryFilterState;
  /** Called with the preset a clicked card stands for. */
  onSelect: (next: DirectoryFilterState) => void;
}) {
  const kpis = useMemo<Kpi[]>(() => {
    const closedStatusIds = new Set(
      data.statuses.filter((s) => s.category === "done" || s.category === "closed").map((s) => s.id),
    );
    const doneStatusIds = new Set(data.statuses.filter((s) => s.category === "done").map((s) => s.id));
    const notStartedStatusIds = new Set(data.statuses.filter((s) => s.category === "not_started").map((s) => s.id));
    const inProgressStatusIds = new Set(data.statuses.filter((s) => s.category === "active").map((s) => s.id));

    let open = 0;
    let done = 0;
    let notStarted = 0;
    let inProgress = 0;
    let overdue = 0;
    let unassigned = 0;
    for (const t of data.tasks) {
      if (doneStatusIds.has(t.status_id)) done++;
      if (closedStatusIds.has(t.status_id)) continue;
      open++;
      if (notStartedStatusIds.has(t.status_id)) notStarted++;
      if (inProgressStatusIds.has(t.status_id)) inProgress++;
      if (t.is_overdue) overdue++;
      if ((data.assigneesByTask.get(t.id) ?? []).length === 0) unassigned++;
    }

    const total = data.tasks.length;
    // Cancelled/closed tasks are out of the denominator: they were never going to be done.
    const countable = total - (data.tasks.filter((t) => closedStatusIds.has(t.status_id)).length - done);
    const completion = countable > 0 ? Math.round((done / countable) * 100) : 0;

    return [
      {
        key: "total",
        label: "إجمالي المهام",
        value: String(total),
        icon: <ListChecks className="h-4 w-4" />,
        tone: "#6366F1",
        raw: total,
        count: total,
        action: "عرض كل المهام",
      },
      {
        key: "open",
        label: "مفتوحة",
        value: String(open),
        icon: <ListTodo className="h-4 w-4" />,
        tone: "#3B82F6",
        raw: open,
        count: open,
        action: "عرض المهام المفتوحة",
      },
      {
        key: "not_started",
        label: "لم تبدأ",
        value: String(notStarted),
        icon: <CircleDashed className="h-4 w-4" />,
        tone: "#64748B",
        raw: notStarted,
        count: notStarted,
        action: "عرض المهام التي لم تبدأ",
      },
      {
        key: "in_progress",
        label: "قيد التنفيذ",
        value: String(inProgress),
        icon: <Loader className="h-4 w-4" />,
        tone: "#8B5CF6",
        raw: inProgress,
        count: inProgress,
        action: "عرض المهام قيد التنفيذ",
      },
      {
        key: "overdue",
        label: "متأخرة",
        value: String(overdue),
        icon: <AlarmClock className="h-4 w-4" />,
        tone: "#EF4444",
        alertWhenPositive: true,
        raw: overdue,
        count: overdue,
        action: "عرض المهام المتأخرة",
      },
      {
        key: "done",
        label: "نسبة الإنجاز",
        value: `${completion}%`,
        hint: `${done} من ${countable}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        tone: "#10B981",
        raw: completion,
        count: done,
        action: "عرض المهام المنجزة",
      },
      {
        key: "unassigned",
        label: "غير معينة",
        value: String(unassigned),
        icon: <UserX className="h-4 w-4" />,
        tone: "#F59E0B",
        raw: unassigned,
        count: unassigned,
        action: "عرض المهام غير المعينة",
      },
    ];
  }, [data]);

  const activeKey = useMemo(() => activeKpiKey(filters, data), [filters, data]);

  // All seven cards on one row, whatever the width.
  return (
    <div className="grid grid-cols-7 gap-2 border-b border-gray-100 px-6 py-3">
      {kpis.map((kpi) => {
        const active = activeKey === kpi.key;
        return (
          <KpiCard
            key={kpi.key}
            kpi={kpi}
            active={active}
            // The active card switches itself off, back to the default open view.
            onClick={() => onSelect(kpiFilters(active ? "open" : kpi.key, data))}
          />
        );
      })}
    </div>
  );
}
