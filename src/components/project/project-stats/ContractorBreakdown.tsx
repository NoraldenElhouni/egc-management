import React, { useState } from "react";
import { DimensionSummary } from "../../../types/project-stats/types";
import { formatCurrency } from "../../../utils/helpper";

interface Props {
  data: DimensionSummary[];
}

function fmt(n: number) {
  return n.toLocaleString("ar-LY", { maximumFractionDigits: 2 });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

const PAGE_SIZE = 10;

export const ContractorBreakdown = React.memo(function ContractorBreakdown({
  data,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 text-center text-gray-400 text-sm">
        No contractor expenses recorded.
      </div>
    );

  const visible = expanded ? data : data.slice(0, PAGE_SIZE);
  const hasMore = data.length > PAGE_SIZE;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i
            className="ti ti-hard-hat text-gray-400 text-lg"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-700">
            Cost by contractor
          </h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {data.length} contractors
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide w-2/5">
                Contractor
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Total
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Jobs
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Avg
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide w-48">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((row, i) => {
              const barFill = row.percentage;

              return (
                <tr
                  key={row.label}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Contractor name + avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {initials(row.label)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700 truncate">
                          {row.label}
                        </p>
                        {row.unpaid > 0 && (
                          <p className="text-xs text-red-500">
                            {fmt(row.unpaid)} due
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3.5 text-right">
                    <p className="font-semibold text-gray-800">
                      {formatCurrency(row.total)}
                    </p>
                    <p className="text-xs text-green-600">
                      {formatCurrency(row.paid)} paid
                    </p>
                  </td>

                  {/* Jobs */}
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {row.count}
                  </td>

                  {/* Avg */}
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {fmt(row.average)}
                    <span className="text-xs text-gray-400 ml-1">LYD</span>
                  </td>

                  {/* Share bar — width = actual % of project total */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${barFill}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                        {row.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer totals */}
          <tfoot className="border-t border-gray-200">
            <tr>
              <td className="px-5 py-3 text-xs font-semibold text-gray-500">
                Total
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                {formatCurrency(data.reduce((s, r) => s + r.total, 0))}
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                {data.reduce((s, r) => s + r.count, 0)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Expand / collapse toggle */}
      {hasMore && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full py-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i
              className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"} text-sm`}
              aria-hidden="true"
            />
            {expanded
              ? "Show less"
              : `Show ${data.length - PAGE_SIZE} more contractors`}
          </button>
        </div>
      )}
    </div>
  );
});
