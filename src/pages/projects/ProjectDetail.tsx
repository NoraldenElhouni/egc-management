import { useState, useEffect, useMemo } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { formatCurrency } from "../../utils/helpper";
import { ProjectPercentage } from "../../types/global.type";

// ─────────────────────────────────────────────
// الأنواع
// ─────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  code: string;
  address: string | null;
  status: string;
  created_at: string;
  description: string | null;
  default_company_percentage: number;
  default_bank_percentage: number;
  clients: {
    first_name: string;
    last_name: string | null;
    phone_number: string;
  } | null;
}

interface Account {
  id: string;
  currency: string;
  type: string;
  balance: number;
  total_transactions: number;
  total_expense: number;
  total_percentage: number;
  refund: number;
  maps: number;
}

interface ProjectBalance {
  id: string;
  currency: string;
  balance: number;
  total_transactions: number;
  total_expense: number;
  total_percentage: number;
  refund: number;
  maps: number;
}

interface TimelinePoint {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
  refund: number;
  maps: number;
}

interface ProjectStats {
  project: Project;
  accounts: Account[];
  balances: ProjectBalance[];
  timeline: TimelinePoint[];
  percentage: ProjectPercentage[];
}

// ─────────────────────────────────────────────
// هوك: جلب بيانات المشروع
// ─────────────────────────────────────────────

export function useProjectStats(projectId: string) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchAll() {
      setLoading(true);

      const [
        { data: projectData, error: projectError },
        { data: accountsData, error: accountsError },
        { data: balancesData, error: balancesError },
        { data: incomesData, error: incomesError },
        { data: expensesData, error: expensesError },
        { data: refundsData, error: refundsError },
        { data: mapsData, error: mapsError },
        { data: percentageData, error: percentageError },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select(
            "id, name, code, address, status, created_at, description, default_company_percentage, default_bank_percentage, clients(first_name, last_name, phone_number)",
          )
          .eq("id", projectId)
          .single(),
        supabase
          .from("accounts")
          .select(
            "id, currency, type, balance, total_transactions, total_expense, total_percentage, refund, maps",
          )
          .eq("owner_id", projectId),
        supabase
          .from("project_balances")
          .select(
            "id, currency, balance, total_transactions, total_expense, total_percentage, refund, maps",
          )
          .eq("project_id", projectId),
        supabase
          .from("project_incomes")
          .select("amount, income_date, currency")
          .eq("project_id", projectId),
        supabase
          .from("project_expenses")
          .select("total_amount, expense_date, currency")
          .eq("project_id", projectId)
          .is("deleted_at", null),
        supabase
          .from("project_refund")
          .select("amount, income_date, currency")
          .eq("project_id", projectId),
        supabase
          .from("project_maps")
          .select("amount, date")
          .eq("project_id", projectId),
        supabase
          .from("project_percentage")
          .select("*")
          .eq("project_id", projectId),
      ]);

      const firstError =
        projectError ||
        accountsError ||
        balancesError ||
        incomesError ||
        expensesError ||
        refundsError ||
        mapsError ||
        percentageError;
      if (firstError || !projectData) {
        setError(firstError);
        setLoading(false);
        return;
      }

      // بناء الخط الزمني
      const monthMap = new Map<string, TimelinePoint>();

      const ensureMonth = (m: string) => {
        let month = monthMap.get(m);
        if (!month) {
          month = {
            month: m,
            income: 0,
            expense: 0,
            refund: 0,
            maps: 0,
          };
          monthMap.set(m, month);
        }
        return month;
      };

      for (const r of incomesData ?? []) {
        if (r.income_date)
          ensureMonth(r.income_date.slice(0, 7)).income += Number(
            r.amount ?? 0,
          );
      }
      for (const r of expensesData ?? []) {
        if (r.expense_date)
          ensureMonth(r.expense_date.slice(0, 7)).expense += Number(
            r.total_amount ?? 0,
          );
      }
      for (const r of refundsData ?? []) {
        if (r.income_date)
          ensureMonth(r.income_date.slice(0, 7)).refund += Number(
            r.amount ?? 0,
          );
      }
      for (const r of mapsData ?? []) {
        if (r.date)
          ensureMonth(r.date.slice(0, 7)).maps += Number(r.amount ?? 0);
      }

      const timeline = Array.from(monthMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      );

      setStats({
        project: projectData as Project,
        accounts: (accountsData ?? []) as Account[],
        balances: (balancesData ?? []) as ProjectBalance[],
        timeline,
        percentage: (percentageData ?? []) as ProjectPercentage[],
      });
      setLoading(false);
    }

    fetchAll();
  }, [projectId]);

  return { stats, loading, error };
}

// ─────────────────────────────────────────────
// خيارات الفلترة الزمنية
// ─────────────────────────────────────────────

type TimeRange = "all" | "year" | "6m" | "3m";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "كل الفترات" },
  { value: "year", label: "سنة" },
  { value: "6m", label: "6 أشهر" },
  { value: "3m", label: "3 أشهر" },
];

function getStartDate(range: TimeRange): string | null {
  if (range === "all") return null;
  const now = new Date();
  const months: Record<Exclude<TimeRange, "all">, number> = {
    year: 12,
    "6m": 6,
    "3m": 3,
  };
  now.setMonth(now.getMonth() - months[range]);
  return now.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("en-LY", {
    month: "short",
    year: "2-digit",
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-LY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  active: {
    label: "نشط",
    class: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  inactive: {
    label: "غير نشط",
    class: "bg-gray-100 text-gray-600 border-gray-200",
  },
  completed: {
    label: "مكتمل",
    class: "bg-blue-100 text-blue-700 border-blue-200",
  },
  paused: {
    label: "متوقف",
    class: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const CURRENCY_LABELS: Record<string, string> = {
  LYD: "LYD",
  EUR: "€",
  USD: "$",
};

// ─────────────────────────────────────────────
// مكوّن: بطاقة إحصاء صغيرة
// ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-muted/40 p-4 text-right border-border`}
    >
      {accent && (
        <div
          className={`w-1 h-6 rounded-full mb-2 ${accent} mr-auto ml-0`}
          style={{ float: "right", marginLeft: "0.5rem" }}
        />
      )}
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// مكوّن: معلومات المشروع
// ─────────────────────────────────────────────

function ProjectInfoCard({
  project,
  percentage,
}: {
  project: Project;
  percentage: number;
}) {
  const status = STATUS_MAP[project.status] ?? {
    label: project.status,
    class: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const clientName = project.clients
    ? `${project.clients.first_name} ${project.clients.last_name ?? ""}`.trim()
    : "—";

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">المشروع</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{project.code}</p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full border ${status.class}`}
        >
          {status.label}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground border-r-2 border-primary/40 pr-3">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">العميل</p>
          <p className="font-medium">{clientName}</p>
          {project.clients?.phone_number && (
            <p className="text-xs text-muted-foreground">
              {project.clients.phone_number}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">الموقع</p>
          <p className="font-medium">{project.address ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">تاريخ الإنشاء</p>
          <p className="font-medium">{fmtDate(project.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">نسبة الشركة</p>
          <p className="font-medium">{percentage}%</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// مكوّن: الرسم البياني للمعاملات عبر الزمن
// ─────────────────────────────────────────────

type ChartSeries = "income" | "expense" | "refund" | "maps";

const SERIES_CONFIG: Record<
  ChartSeries,
  { label: string; colorClass: string; hex: string }
> = {
  income: { label: "مدفوع", colorClass: "bg-emerald-500", hex: "#10b981" },
  expense: { label: "مصروفات", colorClass: "bg-rose-500", hex: "#f43f5e" },
  refund: { label: "استردادات", colorClass: "bg-sky-500", hex: "#0ea5e9" },
  maps: { label: "خرائط", colorClass: "bg-violet-500", hex: "#8b5cf6" },
};

function TimelineChart({
  data,
  timeRange,
  onRangeChange,
}: {
  data: TimelinePoint[];
  timeRange: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}) {
  const [activeSeries, setActiveSeries] = useState<Set<ChartSeries>>(
    new Set(["income", "expense", "refund", "maps"]),
  );
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const toggleSeries = (s: ChartSeries) => {
    setActiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        if (next.size > 1) next.delete(s);
      } else next.add(s);
      return next;
    });
  };

  const maxVal = Math.max(
    ...data.flatMap((d) =>
      (["income", "expense", "refund", "maps"] as ChartSeries[])
        .filter((s) => activeSeries.has(s))
        .map((s) => d[s]),
    ),
    1,
  );

  const hovered = hoveredMonth
    ? data.find((d) => d.month === hoveredMonth)
    : null;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      dir="rtl"
    >
      {/* رأس */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-medium">المعاملات عبر الزمن</h2>
        <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-lg p-1">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRangeChange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeRange === opt.value
                  ? "bg-background border border-border shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* أسطورة قابلة للنقر */}
      <div className="flex items-center gap-3 flex-wrap">
        {(
          Object.entries(SERIES_CONFIG) as [
            ChartSeries,
            (typeof SERIES_CONFIG)[ChartSeries],
          ][]
        ).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => toggleSeries(key)}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              activeSeries.has(key) ? "opacity-100" : "opacity-30"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${cfg.colorClass}`} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* الرسم البياني */}
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          لا توجد بيانات للفترة المحددة
        </div>
      ) : (
        <div className="relative" dir="ltr">
          {/* الخطوط المرجعية */}
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
            {[1, 0.75, 0.5, 0.25].map((f) => (
              <div
                key={f}
                className="border-t border-border/50 w-full relative"
              >
                <span className="absolute right-0 -top-2.5 text-[10px] text-muted-foreground tabular-nums">
                  {((maxVal * f) / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>

          {/* الأعمدة */}
          <div
            className={`flex items-end gap-1 overflow-x-auto pb-6 pr-10 ${
              timeRange === "all" ? "h-56" : "h-44"
            }`}
          >
            {data.map((d) => {
              const isHovered = hoveredMonth === d.month;
              return (
                <div
                  key={d.month}
                  className={`flex flex-col items-center gap-0.5 cursor-pointer group ${
                    timeRange === "all" ? "min-w-[52px]" : "min-w-[36px]"
                  }`}
                  onMouseEnter={() => setHoveredMonth(d.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  <div className="flex items-end gap-0.5 h-32 w-full justify-center">
                    {(
                      ["income", "expense", "refund", "maps"] as ChartSeries[]
                    ).map((s) => {
                      if (!activeSeries.has(s)) return null;
                      const h = Math.max(
                        (d[s] / maxVal) * 112,
                        d[s] > 0 ? 2 : 0,
                      );
                      return (
                        <div
                          key={s}
                          className={`rounded-t transition-all duration-200 ${
                            isHovered
                              ? "opacity-100"
                              : "opacity-75 group-hover:opacity-100"
                          }`}
                          style={{
                            width: `${Math.floor(28 / activeSeries.size)}px`,
                            height: `${h}px`,
                            backgroundColor: SERIES_CONFIG[s].hex,
                          }}
                        />
                      );
                    })}
                  </div>
                  <span
                    className={`text-[10px] transition-colors ${isHovered ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {fmtMonth(d.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تلميح التمرير */}
      {hovered && (
        <div
          className="rounded-lg border border-border bg-muted/60 p-3 text-xs space-y-2"
          dir="rtl"
        >
          <p className="font-medium text-foreground mb-1.5">
            {fmtMonth(hovered.month)}
          </p>

          {(["income", "expense", "refund", "maps"] as ChartSeries[])
            .filter((s) => activeSeries.has(s))
            .map((s, index, arr) => (
              <div
                key={s}
                className={`flex items-center justify-between gap-4 py-1 ${
                  index !== arr.length - 1
                    ? "border-b border-border/60 pb-2"
                    : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${SERIES_CONFIG[s].colorClass}`}
                  />
                  <span className="text-muted-foreground">
                    {SERIES_CONFIG[s].label}
                  </span>
                </div>

                <span className="font-medium tabular-nums">
                  {formatCurrency(hovered[s])}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// مكوّن: ملخص مالي للعملة الواحدة (أكاونت أو بالانس)
// ─────────────────────────────────────────────

interface FinancialCardProps {
  currency: string;
  type?: string;
  balance: number;
  total_transactions: number;
  total_expense: number;
  total_percentage: number;
  refund: number;
  maps: number;
  variant: "account" | "balance";
}

function FinancialCard({
  currency,
  type,
  balance,
  total_transactions,
  total_expense,
  total_percentage,
  refund,
  maps,
  variant,
}: FinancialCardProps) {
  const currLabel = CURRENCY_LABELS[currency] ?? currency;
  const isPositive = balance >= 0;

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 space-y-3 text-right"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted/60 border border-border rounded px-2 py-0.5">
            {currLabel}
          </span>
          {type && (
            <span className="text-xs text-muted-foreground capitalize">
              {type === "cash" ? "كاش" : "بنك"}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {variant === "account" ? "حساب نقدي" : "رصيد استحقاق"}
        </span>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-0.5">الرصيد الحالي</p>
        <p
          className={`text-2xl font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        {[
          {
            label: "إجمالي المدفوع",
            value: total_transactions,
            color: "text-emerald-600",
          },
          {
            label: "إجمالي المصروفات",
            value: total_expense,
            color: "text-rose-600",
          },
          {
            label: "نسبة الشركة",
            value: total_percentage,
            color: "text-violet-600",
          },
          { label: "استردادات", value: refund, color: "text-sky-600" },
          { label: "خرائط", value: maps, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-sm font-semibold tabular-nums ${color}`}>
              {formatCurrency(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// مكوّن: قسم الحسابات والأرصدة
// ─────────────────────────────────────────────

function FinancialSection({
  accounts,
  balances,
}: {
  accounts: Account[];
  balances: ProjectBalance[];
}) {
  const filteredBalances = balances.filter(
    (b) => b.balance !== 0 || b.total_expense !== 0,
  );

  const filteredAccounts = accounts.filter(
    (a) => a.balance !== 0 || a.total_expense !== 0,
  );

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium">المالية</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredBalances.map((b) => (
          <FinancialCard key={b.id} {...b} variant="balance" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredAccounts.map((a) => (
          <FinancialCard key={a.id} {...a} variant="account" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// مكوّن: مؤشرات KPI العليا
// ─────────────────────────────────────────────

function KpiRow({
  stats,
  timelineFiltered,
}: {
  stats: ProjectStats;
  timelineFiltered: TimelinePoint[];
}) {
  const totalIncome = timelineFiltered.reduce((s, d) => s + d.income, 0);
  const totalExpense = timelineFiltered.reduce((s, d) => s + d.expense, 0);
  const totalRefund = timelineFiltered.reduce((s, d) => s + d.refund, 0);
  const totalMaps = timelineFiltered.reduce((s, d) => s + d.maps, 0);

  // الرصيد الكلي من project_balances (مجموع كل العملات — عرض تقريبي)
  const netBalance = stats.balances.reduce((s, b) => s + b.balance, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard
        label="صافي الرصيد (تقريبي)"
        value={formatCurrency(netBalance)}
        accent={netBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"}
      />
      <StatCard
        label="إجمالي المدفوع"
        value={formatCurrency(totalIncome)}
        accent="bg-emerald-500"
      />
      <StatCard
        label="إجمالي المصروفات"
        value={formatCurrency(totalExpense)}
        accent="bg-rose-500"
      />
      <StatCard
        label="الاستردادات"
        value={formatCurrency(totalRefund)}
        accent="bg-sky-500"
      />
      <StatCard
        label="الخرائط"
        value={formatCurrency(totalMaps)}
        accent="bg-violet-500"
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// الصفحة الرئيسية
// ─────────────────────────────────────────────

const ProjectDetails = ({ projectId }: { projectId: string }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("year");
  const { stats, loading, error } = useProjectStats(projectId);

  const filteredTimeline = useMemo(() => {
    if (!stats) return [];
    const startDate = getStartDate(timeRange);
    if (!startDate) return stats.timeline;
    return stats.timeline.filter((d) => d.month >= startDate.slice(0, 7));
  }, [stats, timeRange]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64 text-muted-foreground"
        dir="rtl"
      >
        جارٍ تحميل بيانات المشروع…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className="flex items-center justify-center h-64 text-destructive"
        dir="rtl"
      >
        حدث خطأ أثناء تحميل بيانات المشروع.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      {/* معلومات المشروع */}
      <ProjectInfoCard
        project={stats.project}
        percentage={stats.percentage[0].percentage}
      />

      {/* مؤشرات KPI */}
      <KpiRow stats={stats} timelineFiltered={filteredTimeline} />

      {/* الرسم البياني */}
      <TimelineChart
        data={filteredTimeline}
        timeRange={timeRange}
        onRangeChange={setTimeRange}
      />

      {/* قسم المالية */}
      <FinancialSection accounts={stats.accounts} balances={stats.balances} />
    </div>
  );
};

export default ProjectDetails;
