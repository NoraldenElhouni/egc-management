import React from "react";
import { useProjectBalances } from "../../hooks/projects/useProjectOverview";

interface Props {
  projectId: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface BalanceCardProps {
  currency: string;
  balance: number;
  totalTransactions: number;
  totalExpense: number;
  refund: number;
  maps: number;
  totalPercentage: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  currency,
  balance,
  totalTransactions,
  totalExpense,
  refund,
  maps,
  totalPercentage,
}) => {
  // Health indicator: balance vs total expenses
  const healthPct =
    totalExpense > 0
      ? Math.min(100, Math.round((balance / (totalTransactions || 1)) * 100))
      : 100;

  const isPositive = balance >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      {/* Currency badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase">
          {currency}
        </span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {healthPct}%
        </span>
      </div>

      {/* Main balance */}
      <p className="text-[11px] mb-1">Current balance</p>
      <p
        className={`text-2xl font-semibold tracking-tight mb-4 ${
          isPositive ? "text-white" : "text-red-400"
        }`}
      >
        {fmt(balance)}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Total income" value={fmt(totalTransactions)} />
        <Stat label="Total expense" value={fmt(totalExpense)} dimmed />
        <Stat label="Refunds" value={fmt(refund)} />
        <Stat label="Maps" value={fmt(maps)} />
      </div>

      {/* Percentage bar */}
      {totalPercentage > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span>Percentage allocated</span>
            <span>{fmt(totalPercentage)}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400/60"
              style={{
                width: `${Math.min(100, (totalPercentage / totalTransactions) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; dimmed?: boolean }> = ({
  label,
  value,
  dimmed,
}) => (
  <div>
    <p className="text-[10px] mb-0.5">{label}</p>
    <p
      className={`text-sm font-medium ${dimmed ? "text-black/50" : "text-black/70"}`}
    >
      {value}
    </p>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const BalanceSkeleton = () => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 animate-pulse">
    <div className="h-4 bg-white/5 rounded w-20 mb-4" />
    <div className="h-8 bg-white/5 rounded w-32 mb-4" />
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-white/5 rounded w-16 mb-1" />
          <div className="h-4 bg-white/5 rounded w-20" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BalanceSection: React.FC<Props> = ({ projectId }) => {
  const { data, isLoading } = useProjectBalances(projectId);

  return (
    <section>
      <SectionLabel icon="₿" label="Accounts & balances" />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BalanceSkeleton />
          <BalanceSkeleton />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No balance accounts yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.map((b) => (
            <BalanceCard
              key={b.currency}
              currency={b.currency}
              balance={b.balance}
              totalTransactions={b.total_transactions}
              totalExpense={b.total_expense}
              refund={b.refund}
              maps={b.maps}
              totalPercentage={b.total_percentage}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default BalanceSection;

// ─── Shared helpers (exported for reuse in other components) ──────────────────

export const SectionLabel: React.FC<{ icon: string; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-white/20 text-sm">{icon}</span>
    <span className="text-xs font-medium uppercase tracking-widest">
      {label}
    </span>
  </div>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] py-8 text-center">
    <p className="text-sm">{message}</p>
  </div>
);
