import React from "react";
import { SectionLabel, EmptyState } from "./BalanceSection";
import { useProjectStats } from "../../hooks/projects/useProjectOverview";

interface Props {
  projectId: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const fmtAmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface StatRowProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "amber" | "neutral";
}

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  sub,
  accent = "neutral",
}) => {
  const accentClass = {
    green: "text-emerald-400",
    red: "text-red-400",
    amber: "text-amber-400",
    neutral: "text-white/80",
  }[accent];

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm text-white/50">{label}</p>
        {sub && <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-medium tabular-nums ${accentClass}`}>
        {value}
      </p>
    </div>
  );
};

const FinancialStats: React.FC<Props> = ({ projectId }) => {
  const { data, isLoading } = useProjectStats(projectId);

  const paidPct =
    data && data.total_expenses > 0
      ? Math.round((data.total_expenses_paid / data.total_expenses) * 100)
      : 0;

  return (
    <section>
      <SectionLabel icon="$" label="Financial overview" />

      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-white/5 rounded w-28" />
              <div className="h-4 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <EmptyState message="No financial data available" />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <StatRow
              label="Total income"
              value={fmtAmt(data.total_incomes)}
              sub={`${fmt(data.income_count)} transactions`}
              accent="green"
            />
            <StatRow
              label="Total expenses"
              value={fmtAmt(data.total_expenses)}
              sub={`${fmt(data.expense_count)} expenses`}
              accent="red"
            />
            <StatRow
              label="Amount paid"
              value={fmtAmt(data.total_expenses_paid)}
              accent="neutral"
            />
            <StatRow
              label="Outstanding"
              value={fmtAmt(data.total_expenses_unpaid)}
              accent={data.total_expenses_unpaid > 0 ? "amber" : "neutral"}
            />
            <StatRow
              label="Refunds received"
              value={fmtAmt(data.total_refunds)}
              accent="green"
            />
          </div>

          {/* Payment progress bar */}
          <div className="px-5 pb-5 pt-3 border-t border-white/[0.05]">
            <div className="flex justify-between text-[11px] text-white/25 mb-2">
              <span>Expenses paid</span>
              <span>{paidPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${paidPct}%`,
                  background:
                    paidPct >= 80
                      ? "#34d399"
                      : paidPct >= 50
                        ? "#fbbf24"
                        : "#f87171",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FinancialStats;
