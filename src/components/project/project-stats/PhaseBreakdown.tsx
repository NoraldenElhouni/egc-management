import React, { useState } from "react";
import { PhaseSummary } from "../../../types/project-stats/types";

interface Props {
  phases: PhaseSummary[];
}

const phaseColors: Record<
  string,
  { bar: string; badge: string; text: string }
> = {
  construction: {
    bar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
  },
  finishing: {
    bar: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700",
    text: "text-purple-700",
  },
  design: {
    bar: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700",
    text: "text-teal-700",
  },
};

function getColors(label: string) {
  return (
    phaseColors[label.toLowerCase()] ?? {
      bar: "bg-gray-400",
      badge: "bg-gray-100 text-gray-600",
      text: "text-gray-700",
    }
  );
}

function fmt(n: number) {
  return n.toLocaleString("ar-LY", { maximumFractionDigits: 2 });
}

export const PhaseBreakdown = React.memo(function PhaseBreakdown({
  phases,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(
    phases[0]?.label ?? null,
  );

  if (phases.length === 0)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 text-center text-gray-400 text-sm">
        No phase data recorded yet.
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <i
          className="ti ti-layout-columns text-gray-400 text-lg"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-gray-700">Cost by phase</h2>
      </div>

      <div className="divide-y divide-gray-50">
        {phases.map((phase) => {
          const colors = getColors(phase.label);
          const isOpen = expanded === phase.label;

          return (
            <div key={phase.label}>
              <button
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : phase.label)}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.bar}`}
                />
                <span className="text-sm font-medium text-gray-700 capitalize w-28 flex-shrink-0">
                  {phase.label}
                </span>

                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${Math.min(phase.percentage, 100)}%` }}
                  />
                </div>

                <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                  {phase.percentage.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-gray-800 w-32 text-right flex-shrink-0">
                  {fmt(phase.total)} LYD
                </span>
                <i
                  className={`ti ti-chevron-down text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 bg-gray-50/50">
                  <div className="flex gap-4 mb-4 pt-3">
                    <div className="bg-white rounded-lg border border-gray-100 px-4 py-2 flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Expenses</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {phase.count}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 px-4 py-2 flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Average</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {fmt(phase.average)} LYD
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 px-4 py-2 flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Paid</p>
                      <p className="text-sm font-semibold text-green-600">
                        {fmt(phase.paid)} LYD
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 px-4 py-2 flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Unpaid</p>
                      <p className="text-sm font-semibold text-red-500">
                        {fmt(phase.unpaid)} LYD
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-wide">
                        <th className="text-left pb-2 font-medium">Type</th>
                        <th className="text-right pb-2 font-medium">Total</th>
                        <th className="text-right pb-2 font-medium">Count</th>
                        <th className="text-right pb-2 font-medium">Average</th>
                        <th className="text-right pb-2 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {phase.byExpenseType.map((t) => (
                        <tr key={t.label} className="text-gray-600">
                          <td className="py-2 capitalize font-medium text-gray-700">
                            {t.label}
                          </td>
                          <td className="py-2 text-right">{fmt(t.total)}</td>
                          <td className="py-2 text-right">{t.count}</td>
                          <td className="py-2 text-right">{fmt(t.average)}</td>
                          <td className="py-2 text-right">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}
                            >
                              {t.percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
