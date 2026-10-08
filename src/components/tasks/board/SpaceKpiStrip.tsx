import { useMemo, type ReactNode } from "react";
import { AlarmClock, CheckCircle2, ListChecks, ListTodo, Lock, UserX } from "lucide-react";
import type { TaskDirectoryData } from "../../../hooks/tasks/useTaskDirectory";

// KPI row at the top of the space view. Always describes the WHOLE space —
// it reads data.tasks, not the search/filter-narrowed list below it — so
// the numbers don't jump around while someone is filtering.
//
// "Open" is any status outside done/closed (same rule the board uses).
// Overdue counts tasks.is_overdue on open tasks, so the number agrees
// with the "متأخرة" filter and the red badges in the list.

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone: string;
  /** Draws the card in the warning colour when the value is non-zero. */
  alertWhenPositive?: boolean;
  raw: number;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const alert = kpi.alertWhenPositive && kpi.raw > 0;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm ${
        alert ? "border-red-200" : "border-gray-100"
      }`}
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
        <div className="text-xs text-gray-500">{kpi.label}</div>
        {kpi.hint && <div className="text-xs text-gray-400">{kpi.hint}</div>}
      </div>
    </div>
  );
}

export default function SpaceKpiStrip({ data }: { data: TaskDirectoryData }) {
  const kpis = useMemo<Kpi[]>(() => {
    const closedStatusIds = new Set(
      data.statuses.filter((s) => s.category === "done" || s.category === "closed").map((s) => s.id),
    );
    const doneStatusIds = new Set(data.statuses.filter((s) => s.category === "done").map((s) => s.id));

    let open = 0;
    let done = 0;
    let overdue = 0;
    let unassigned = 0;
    let blocked = 0;
    for (const t of data.tasks) {
      if (doneStatusIds.has(t.status_id)) done++;
      if (closedStatusIds.has(t.status_id)) continue;
      open++;
      if (t.is_overdue) overdue++;
      if ((data.assigneesByTask.get(t.id) ?? []).length === 0) unassigned++;
      if (data.blockedTaskIds.has(t.id)) blocked++;
    }

    const total = data.tasks.length;
    // Cancelled/closed tasks are out of the denominator: they were never going to be done.
    const countable = total - (data.tasks.filter((t) => closedStatusIds.has(t.status_id)).length - done);
    const completion = countable > 0 ? Math.round((done / countable) * 100) : 0;

    return [
      { label: "إجمالي المهام", value: String(total), icon: <ListChecks className="h-4 w-4" />, tone: "#6366F1", raw: total },
      { label: "مفتوحة", value: String(open), icon: <ListTodo className="h-4 w-4" />, tone: "#3B82F6", raw: open },
      {
        label: "متأخرة",
        value: String(overdue),
        icon: <AlarmClock className="h-4 w-4" />,
        tone: "#EF4444",
        alertWhenPositive: true,
        raw: overdue,
      },
      {
        label: "نسبة الإنجاز",
        value: `${completion}%`,
        hint: `${done} من ${countable}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        tone: "#10B981",
        raw: completion,
      },
      { label: "غير معينة", value: String(unassigned), icon: <UserX className="h-4 w-4" />, tone: "#F59E0B", raw: unassigned },
      { label: "محظورة", value: String(blocked), icon: <Lock className="h-4 w-4" />, tone: "#6B7280", raw: blocked },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-2 gap-2.5 border-b border-gray-100 px-6 py-3 sm:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
