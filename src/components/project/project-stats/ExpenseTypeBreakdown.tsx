import React from "react";
import { DimensionSummary } from "../../../types/project-stats/types";

interface Props {
  data: DimensionSummary[];
}

const typeConfig: Record<string, { icon: string; color: string; bar: string }> =
  {
    material: {
      icon: "ti-package",
      color: "text-amber-600 bg-amber-50",
      bar: "bg-amber-400",
    },
    labor: {
      icon: "ti-tools",
      color: "text-blue-600 bg-blue-50",
      bar: "bg-blue-400",
    },
  };

function getConfig(label: string) {
  return (
    typeConfig[label.toLowerCase()] ?? {
      icon: "ti-tag",
      color: "text-gray-500 bg-gray-100",
      bar: "bg-gray-300",
    }
  );
}

function fmt(n: number) {
  return n.toLocaleString("ar-LY", { maximumFractionDigits: 2 });
}

export const ExpenseTypeBreakdown = React.memo(function ExpenseTypeBreakdown({
  data,
}: Props) {
  if (data.length === 0)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 text-center text-gray-400 text-sm">
        No expense type data.
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <i className="ti ti-tags text-gray-400 text-lg" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-700">
          Cost by expense type
        </h2>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((row) => {
          const cfg = getConfig(row.label);
          return (
            <div
              key={row.label}
              className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}
                >
                  <i className={`ti ${cfg.icon} text-sm`} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {row.label}
                  </p>
                  <p className="text-xs text-gray-400">{row.count} expenses</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {fmt(row.total)} LYD
                </span>
              </div>

              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${cfg.bar}`}
                  style={{ width: `${Math.min(row.percentage, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Avg {fmt(row.average)} LYD</span>
                <div className="flex gap-3">
                  <span className="text-green-600">Paid {fmt(row.paid)}</span>
                  <span className="text-red-500">Unpaid {fmt(row.unpaid)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
