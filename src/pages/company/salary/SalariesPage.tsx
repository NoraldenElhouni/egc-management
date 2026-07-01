import { useMemo, useState } from "react";
import { Calendar, Users, Wallet, CheckCircle2, Clock } from "lucide-react";
import { Table } from "@tanstack/react-table";
import GenericTable from "../../../components/tables/table";
import { PayrollColumns } from "../../../components/tables/columns/PayrollColumns";
import { usePayroll } from "../../../hooks/usePayroll";
import { PayrollWithRelations } from "../../../types/extended.type";
import { formatCurrency } from "../../../utils/helpper";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getMonthRange = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

const isInMonth = (dateStr: string | null | undefined, month: string) => {
  if (!dateStr || !month) return true;
  const { from, to } = getMonthRange(month);
  const date = new Date(dateStr).getTime();
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to + "T23:59:59").getTime();
  return date >= fromMs && date <= toMs;
};

function MonthFilterSync({
  table,
  month,
}: {
  table: Table<PayrollWithRelations>;
  month: string;
}) {
  const { from, to } = getMonthRange(month);
  useMemo(() => {
    table.getColumn("pay_date")?.setFilterValue(month ? [from, to] : undefined);
  }, [month]);
  return null;
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "indigo" | "green" | "amber" | "blue";
}) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneMap[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

const SalariesPage = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const { payroll, loading, error } = usePayroll();

  const stats = useMemo(() => {
    const filtered = payroll.filter((p) => isInMonth(p.pay_date, month));

    const totalEmployees = filtered.length;
    const totalSalaries = filtered.reduce(
      (sum, p) => sum + (p.total_salary ?? 0),
      0,
    );
    const paidCount = filtered.filter((p) => p.status === "paid").length;
    const pendingCount = filtered.filter((p) => p.status === "pending").length;

    return { totalEmployees, totalSalaries, paidCount, pendingCount };
  }, [payroll, month]);

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;

  return (
    <div className="p-4 space-y-4">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="عدد الموظفين"
          value={String(stats.totalEmployees)}
          icon={Users}
          tone="indigo"
        />
        <KpiCard
          label="إجمالي الرواتب"
          value={formatCurrency(stats.totalSalaries, "LYD")}
          icon={Wallet}
          tone="blue"
        />
        <KpiCard
          label="تم الدفع"
          value={String(stats.paidCount)}
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard
          label="قيد الانتظار"
          value={String(stats.pendingCount)}
          icon={Clock}
          tone="amber"
        />
      </div>

      <GenericTable
        data={payroll}
        columns={PayrollColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900">رواتب الموظفين</h2>

            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                strokeWidth={2}
              />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="تصفية حسب الشهر"
                className="pl-9 pr-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
              />
            </div>
          </div>
        }
        headerActions={(table) => (
          <MonthFilterSync table={table} month={month} />
        )}
      />
    </div>
  );
};

export default SalariesPage;
