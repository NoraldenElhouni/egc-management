import { useMemo, useState, type ReactNode } from "react";
import { AlarmClock, CheckCircle2, ListChecks, ListTodo, PlusCircle, AlertTriangle } from "lucide-react";
import KpiCard from "../../components/ui/KpiCard";
import { PERIOD_LABELS, periodRange, type PeriodPreset } from "../../hooks/tasks/usePerformance";
import { useTaskDashboard, type DashboardTrendPoint, type TaskDashboard } from "../../hooks/tasks/useTaskDashboard";

// Tasks dashboard (admin): the whole company's tasks on one screen, no
// scrolling — KPI row on top, three panels filling the rest. All numbers come
// from tasks.dashboard_summary (tasks/migrations/2026-10-11_task_dashboard.sql);
// this page only displays them. Route is gated by view_task_dashboard in
// TasksRoutes.tsx.
//
// The period picker only moves the "in the period" numbers (created,
// completed, on time). Total / open / overdue / completion are the current
// state, and the trend is always the last 6 months.

const fmt = (v: number) => v.toLocaleString("en-US");
const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-gray-800">{title}</div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function TrendPanel({ trend }: { trend: DashboardTrendPoint[] }) {
  const max = Math.max(1, ...trend.flatMap((p) => [p.created, p.completed]));
  return (
    <Panel title="المنشأة مقابل المنجزة — آخر 6 أشهر">
      <div className="mb-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
          أُنشئت
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          أُنجزت
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-end gap-3">
        {trend.map((p) => (
          <div key={p.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-1">
              {(
                [
                  [p.created, "bg-slate-400", "أُنشئت"],
                  [p.completed, "bg-emerald-500", "أُنجزت"],
                ] as const
              ).map(([value, color, label]) => (
                <div key={label} className="flex h-full w-1/2 max-w-[1.75rem] flex-col items-center justify-end" title={`${label}: ${fmt(value)}`}>
                  <span className="text-[10px] font-medium text-gray-600">{value > 0 ? fmt(value) : ""}</span>
                  <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max(value > 0 ? 3 : 0, (value / max) * 85)}%` }} />
                </div>
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              {new Date(`${p.month}T00:00:00`).toLocaleDateString("ar", { month: "short" })}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Ring({ value, color, label, hint }: { value: number | null; color: string; label: string; hint: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(1, Math.max(0, value ?? 0));
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
          {pct(value)}
        </span>
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-400">{hint}</div>
    </div>
  );
}

function RatioPanel({ data }: { data: TaskDashboard }) {
  const countable = data.total - data.by_status.closed;
  return (
    <Panel title="النسب">
      <div className="flex flex-1 items-center justify-around gap-2">
        <Ring
          value={data.completion_rate}
          color="#10B981"
          label="نسبة الإنجاز"
          hint={`${fmt(data.by_status.done)} من ${fmt(countable)} (الكل)`}
        />
        <Ring
          value={data.on_time_rate}
          color="#3B82F6"
          label="التسليم في الموعد"
          hint={data.completed_with_due > 0 ? `من ${fmt(data.completed_with_due)} منجزة في الفترة` : "لا توجد منجزة بتاريخ استحقاق"}
        />
      </div>
    </Panel>
  );
}

const STATUS_ROWS: { key: keyof TaskDashboard["by_status"]; label: string; color: string }[] = [
  { key: "not_started", label: "لم تبدأ", color: "bg-slate-400" },
  { key: "active", label: "قيد التنفيذ", color: "bg-violet-500" },
  { key: "done", label: "منجزة", color: "bg-emerald-500" },
  { key: "closed", label: "ملغاة", color: "bg-gray-300" },
];

function StatusPanel({ data }: { data: TaskDashboard }) {
  const total = Math.max(1, data.total);
  return (
    <Panel title="حسب الحالة">
      <div className="flex flex-1 flex-col justify-center gap-4">
        {STATUS_ROWS.map((row) => {
          const value = data.by_status[row.key];
          return (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700">{row.label}</span>
                <span className="font-semibold text-gray-900">
                  {fmt(value)} <span className="text-xs font-normal text-gray-400">({pct(value / total)})</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(value / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(() => periodRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const { data, isPending, error } = useTaskDashboard(range);

  return (
    <div dir="rtl" className="flex h-full flex-col gap-4 overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">لوحة المهام</h1>
          <p className="mt-0.5 text-sm text-gray-500">نظرة سريعة على كل مهام الشركة</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PeriodPreset)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
            aria-label="الفترة"
          >
            {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          {preset === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm" aria-label="من" />
              <span className="text-gray-400">—</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm" aria-label="إلى" />
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          تعذّر تحميل البيانات: {(error as Error).message}
        </div>
      ) : isPending || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-5 gap-3">
            <KpiCard label="إجمالي المهام" value={fmt(data.total)} icon={ListChecks} tone="indigo" />
            <KpiCard label="أُنشئت في الفترة" value={fmt(data.created)} icon={PlusCircle} tone="blue" />
            <KpiCard label="أُنجزت في الفترة" value={fmt(data.completed)} icon={CheckCircle2} tone="green" />
            <KpiCard label="مفتوحة" value={fmt(data.open)} icon={ListTodo} tone="amber" />
            <KpiCard label="متأخرة" value={fmt(data.overdue)} icon={AlarmClock} tone="red" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
            <TrendPanel trend={data.trend} />
            <RatioPanel data={data} />
            <StatusPanel data={data} />
          </div>
        </>
      )}
    </div>
  );
}
