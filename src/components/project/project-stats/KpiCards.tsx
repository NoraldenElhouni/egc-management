import React from "react";
import { ProjectStats } from "../../../types/project-stats/types";

interface Props {
  stats: ProjectStats;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: "blue" | "green" | "red" | "amber" | "purple";
}) {
  const accentMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", value: "text-blue-700" },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      value: "text-green-700",
    },
    red: { bg: "bg-red-50", icon: "text-red-600", value: "text-red-700" },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      value: "text-purple-700",
    },
  };
  const colors = accent
    ? accentMap[accent]
    : { bg: "bg-gray-50", icon: "text-gray-500", value: "text-gray-800" };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}
      >
        <i className={`ti ${icon} text-lg ${colors.icon}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-xl font-semibold ${colors.value} leading-tight`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number, currency: string) {
  return `${n.toLocaleString("ar-LY", { maximumFractionDigits: 2 })} ${currency}`;
}

export const KpiCards = React.memo(function KpiCards({ stats }: Props) {
  const {
    totalCost,
    totalPaid,
    totalUnpaid,
    currency,
    averageCostPerPhase,
    byContractor,
    byVendor,
    expenseCount,
  } = stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      <KpiCard
        label="Total cost"
        value={fmt(totalCost, currency)}
        sub={`${expenseCount} expenses`}
        icon="ti-receipt"
        accent="blue"
      />
      <KpiCard
        label="Total paid"
        value={fmt(totalPaid, currency)}
        icon="ti-circle-check"
        accent="green"
      />
      <KpiCard
        label="Remaining"
        value={fmt(totalUnpaid, currency)}
        icon="ti-clock-dollar"
        accent="red"
      />
      <KpiCard
        label="Avg / phase"
        value={fmt(averageCostPerPhase, currency)}
        icon="ti-chart-pie"
        accent="purple"
      />
      <KpiCard
        label="Contractors"
        value={byContractor.length.toString()}
        sub={`Avg ${fmt(stats.averageCostPerContractor, currency)}`}
        icon="ti-hard-hat"
        accent="amber"
      />
      <KpiCard
        label="Vendors"
        value={byVendor.length.toString()}
        sub={`Avg ${fmt(stats.averageCostPerVendor, currency)}`}
        icon="ti-building-store"
      />
    </div>
  );
});
