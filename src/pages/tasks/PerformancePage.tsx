import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Info, Loader2, Target, Trophy, Zap } from "lucide-react";
import KpiCard from "../../components/ui/KpiCard";
import Badge from "../../components/ui/Badge";
import Dialog from "../../components/ui/Dialog";
import { colorFor } from "../../components/tasks/board/employeeAvatar";
import {
  PERIOD_LABELS,
  periodRange,
  usePerformanceDepartments,
  usePerformancePersonTasks,
  usePerformanceSummary,
  usePerformanceTrend,
  type PeriodPreset,
  type PerformanceRow,
  type PerformanceTaskRow,
  type PersonTypeFilter,
} from "../../hooks/tasks/usePerformance";

// Task performance dashboard (admin). All scoring is done in SQL
// (tasks/migrations/2026-10-08_task_performance.sql); this page only
// displays what tasks.performance_* return. Route is gated by
// view_task_performance in TasksRoutes.tsx.

// Must match tasks_private.perf_cfg() in the migration (min_scored_tasks / min_efficiency).
const MIN_SCORED_TASKS = 3;
const MIN_EFFICIENCY_PCT = 70;

const PERSON_TYPE_LABELS: Record<PersonTypeFilter, string> = {
  all: "الكل",
  employee: "الموظفون",
  contractor: "المقاولون",
};

type SortKey = "points" | "efficiency" | "on_time_rate" | "open_overdue" | "scored_tasks";

const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const num = (v: number | null | undefined) => (v == null ? "—" : v.toFixed(1));
const fullName = (r: Pick<PerformanceRow, "first_name" | "last_name">) =>
  `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "غير معروف";

function efficiencyVariant(e: number | null): "success" | "info" | "warning" | "danger" | "default" {
  if (e == null) return "default";
  if (e >= 0.9) return "success";
  if (e >= 0.7) return "info";
  if (e >= 0.5) return "warning";
  return "danger";
}

function Avatar({ id, name }: { id: string; name: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: colorFor(id) }}
    >
      {name.slice(0, 1) || "?"}
    </span>
  );
}

function BestCard({ title, row, empty }: { title: string; row: PerformanceRow | undefined; empty: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
        <Trophy className="h-4 w-4 text-amber-500" />
        {title}
      </div>
      {row ? (
        <div className="flex items-center gap-3">
          <Avatar id={row.user_id} name={fullName(row)} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-gray-900">{fullName(row)}</div>
            <div className="text-xs text-gray-500">
              {num(row.points)} نقطة · كفاءة {pct(row.efficiency)} · {row.scored_tasks} مهمة
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">{empty}</div>
      )}
    </div>
  );
}

function TrendBars({ personType, departmentId }: { personType: PersonTypeFilter; departmentId: string | null }) {
  const { data, isPending } = usePerformanceTrend({ personType, departmentId });
  if (isPending) return <div className="h-32 animate-pulse rounded-lg bg-slate-100" />;
  if (!data?.length) return <div className="py-6 text-center text-sm text-gray-400">لا توجد بيانات لآخر 6 أشهر</div>;
  return (
    <div className="flex h-36 items-end gap-3">
      {data.map((p) => {
        const e = p.efficiency ?? 0;
        // 120% (full early bonus) fills the bar
        const h = Math.max(4, Math.min(1, e / 1.2) * 100);
        return (
          <div key={p.month} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${num(p.points)} نقطة · ${p.scored_tasks} مهمة`}>
            <span className="text-xs font-semibold text-gray-700">{pct(p.efficiency)}</span>
            <div className="flex h-24 w-full items-end">
              <div
                className={`w-full rounded-t ${e >= 0.9 ? "bg-green-500" : e >= 0.7 ? "bg-blue-500" : e >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400">
              {new Date(p.month).toLocaleDateString("ar", { month: "short", year: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function timingText(t: PerformanceTaskRow): string {
  if (!t.scored) return "بدون تاريخ استحقاق (غير مقيّمة)";
  const r = t.lateness_ratio ?? 0;
  const pre = t.kind === "open_overdue" ? "مفتوحة ومتأخرة: " : "";
  if (r <= 0) return `${pre}${r < -0.01 ? `مبكرة ${Math.round(-r * 100)}%` : "في الموعد"}`;
  return `${pre}متأخرة ${Math.round(r * 100)}% من مدة المهمة`;
}

function PersonDrillDown({
  row,
  range,
  onClose,
}: {
  row: PerformanceRow | null;
  range: { from: string; to: string };
  onClose: () => void;
}) {
  const { data, isPending, error } = usePerformancePersonTasks(row?.user_id ?? null, range);
  return (
    <Dialog isOpen={!!row} onClose={onClose}>
      {row && (
        <div dir="rtl">
          <h2 className="text-lg font-bold text-gray-900">{fullName(row)}</h2>
          <p className="mb-3 text-sm text-gray-500">
            {num(row.points)} من {num(row.max_points)} نقطة ممكنة · كفاءة {pct(row.efficiency)}
          </p>
          {isPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{(error as Error).message}</div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="p-2 font-medium">المهمة</th>
                    <th className="p-2 font-medium">التسليم</th>
                    <th className="p-2 font-medium">المدة (يوم)</th>
                    <th className="p-2 font-medium">الوزن</th>
                    <th className="p-2 font-medium">المعامل</th>
                    <th className="p-2 font-medium">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((t) => (
                    <tr key={`${t.task_id}`} className="border-t border-gray-100">
                      <td className="max-w-[16rem] truncate p-2">
                        <Link to={`/tasks/task/${t.task_id}`} className="text-gray-800 hover:underline">
                          {t.title}
                        </Link>
                      </td>
                      <td className="p-2 text-gray-600">{timingText(t)}</td>
                      <td className="p-2 text-gray-600">{t.planned_days ?? "—"}</td>
                      <td className="p-2 text-gray-600">
                        {t.share}
                        {t.share !== t.weight && <span className="text-xs text-gray-400"> (من {t.weight})</span>}
                      </td>
                      <td className="p-2 text-gray-600">{t.multiplier ?? "—"}</td>
                      <td className="p-2 font-semibold text-gray-900">{t.points}</td>
                    </tr>
                  ))}
                  {data?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        لا توجد مهام في هذه الفترة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

export default function PerformancePage() {
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [personType, setPersonType] = useState<PersonTypeFilter>("all");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDesc, setSortDesc] = useState(true);
  const [openRow, setOpenRow] = useState<PerformanceRow | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const range = useMemo(() => periodRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const { data: rows, isPending, error } = usePerformanceSummary({ range, personType, departmentId });
  const { data: departments } = usePerformanceDepartments();

  const sorted = useMemo(() => {
    const dir = sortDesc ? -1 : 1;
    return [...(rows ?? [])].sort((a, b) => ((a[sortKey] ?? -1) - (b[sortKey] ?? -1)) * dir);
  }, [rows, sortKey, sortDesc]);

  const totals = useMemo(() => {
    const all = rows ?? [];
    const points = all.reduce((s, r) => s + r.points, 0);
    const max = all.reduce((s, r) => s + r.max_points, 0);
    const scored = all.reduce((s, r) => s + r.scored_tasks, 0);
    const onTime = all.reduce((s, r) => s + (r.on_time_rate ?? 0) * r.scored_tasks, 0);
    return {
      points,
      efficiency: max > 0 ? points / max : null,
      onTimeRate: scored > 0 ? onTime / scored : null,
      openOverdue: all.reduce((s, r) => s + r.open_overdue, 0),
      unscored: all.reduce((s, r) => s + r.unscored_tasks, 0),
    };
  }, [rows]);

  // rows arrive ordered by points, so the first eligible one is the best
  const bestEmployee = rows?.find((r) => !r.is_contractor && r.is_eligible);
  const bestContractor = rows?.find((r) => r.is_contractor && r.is_eligible);
  const noBest = `لا أحد مؤهل بعد (يلزم ${MIN_SCORED_TASKS} مهام مقيّمة وكفاءة ${MIN_EFFICIENCY_PCT}% على الأقل)`;

  const header = (key: SortKey, label: string) => (
    <th className="p-3 font-medium">
      <button
        onClick={() => {
          if (sortKey === key) setSortDesc((d) => !d);
          else {
            setSortKey(key);
            setSortDesc(true);
          }
        }}
        className="inline-flex items-center gap-1 hover:text-gray-800"
      >
        {label}
        {sortKey === key && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div dir="rtl" className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">أداء المهام</h1>
          <p className="mt-1 text-sm text-gray-500">نقاط وكفاءة كل موظف ومقاول حسب الالتزام بمواعيد التسليم</p>
        </div>
        <button
          onClick={() => setShowHelp((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          <Info className="h-3.5 w-3.5" />
          كيف تُحسب النقاط؟
        </button>
      </div>

      {showHelp && (
        <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
          <p>
            <b>الوزن:</b> كلما كانت المهمة أطول (حسب الوقت المقدّر، وإلا الفرق بين تاريخ البدء والاستحقاق) زاد وزنها،
            لكن بشكل متدرّج: مهمة يوم = 1، 4 أيام = 3، 16 يوم = 5، وأكثر من شهر = 6 كحد أقصى.
          </p>
          <p>
            <b>المعامل:</b> يُقاس التأخير بنسبة مدة المهمة نفسها، فتأخير يوم في مهمة يومين أسوأ بكثير من تأخير يوم في مهمة
            30 يوماً. التسليم في الموعد = 1، التسليم المبكر يزيد حتى 1.2، والتأخير بقدر مدة المهمة كاملة = 0.
          </p>
          <p>
            <b>النقاط = الوزن × المعامل.</b> الكفاءة = النقاط ÷ مجموع الأوزان (تقيس الجودة بغض النظر عن عدد المهام). المهام
            المفتوحة المتأخرة تُحسب أيضاً، والمهمة المشتركة يُقسَّم وزنها بين المسؤولين. المهام بدون تاريخ استحقاق لا تُقيَّم.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as PeriodPreset)}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
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
        <div className="flex overflow-hidden rounded-md border border-gray-200">
          {(Object.keys(PERSON_TYPE_LABELS) as PersonTypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setPersonType(t)}
              className={`px-3 py-1.5 text-sm ${personType === t ? "bg-primary-superLight font-medium text-primary" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {PERSON_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <select
          value={departmentId ?? ""}
          onChange={(e) => setDepartmentId(e.target.value || null)}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
          aria-label="القسم"
        >
          <option value="">كل الأقسام</option>
          {(departments ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          تعذّر تحميل البيانات: {(error as Error).message}
        </div>
      ) : isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="كفاءة الفريق" value={pct(totals.efficiency)} icon={Target} tone="indigo" />
            <KpiCard label="التسليم في الموعد" value={pct(totals.onTimeRate)} icon={Clock} tone="green" />
            <KpiCard label="إجمالي النقاط" value={num(totals.points)} icon={Zap} tone="blue" />
            <KpiCard label="مهام مفتوحة متأخرة" value={String(totals.openOverdue)} icon={AlertTriangle} tone="amber" />
          </div>

          {totals.unscored > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {totals.unscored} مهمة منجزة بدون تاريخ استحقاق لم تُحتسب في النقاط — حدّد تاريخ استحقاق لكل مهمة لتكون
              النتائج دقيقة.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <BestCard title="أفضل موظف" row={bestEmployee} empty={noBest} />
            <BestCard title="أفضل مقاول" row={bestContractor} empty={noBest} />
          </div>

          {/* Leaderboard */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="w-12 p-3 font-medium">#</th>
                    <th className="p-3 font-medium">الاسم</th>
                    {header("scored_tasks", "المهام المنجزة")}
                    {header("points", "النقاط")}
                    {header("efficiency", "الكفاءة")}
                    {header("on_time_rate", "في الموعد")}
                    {header("open_overdue", "متأخرة مفتوحة")}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr
                      key={r.user_id}
                      onClick={() => setOpenRow(r)}
                      className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3 text-gray-400">{i + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar id={r.user_id} name={fullName(r)} />
                          <span className="font-medium text-gray-900">{fullName(r)}</span>
                          <Badge label={r.is_contractor ? "مقاول" : "موظف"} variant={r.is_contractor ? "purple" : "default"} size="sm" />
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">
                        {r.scored_tasks}
                        {r.unscored_tasks > 0 && <span className="text-xs text-amber-600"> (+{r.unscored_tasks} غير مقيّمة)</span>}
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{num(r.points)}</td>
                      <td className="p-3">
                        <Badge label={pct(r.efficiency)} variant={efficiencyVariant(r.efficiency)} size="sm" />
                      </td>
                      <td className="p-3 text-gray-700">{pct(r.on_time_rate)}</td>
                      <td className={`p-3 ${r.open_overdue > 0 ? "font-semibold text-red-600" : "text-gray-400"}`}>{r.open_overdue}</td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-gray-400">
                        لا توجد مهام منجزة أو متأخرة في هذه الفترة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Trend: last 6 months, same person-type / department filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-gray-800">كفاءة الفريق خلال آخر 6 أشهر</div>
        <TrendBars personType={personType} departmentId={departmentId} />
      </div>

      <PersonDrillDown row={openRow} range={range} onClose={() => setOpenRow(null)} />
    </div>
  );
}
