import React, { useState } from "react";
import { DimensionSummary } from "../../../types/project-stats/types";

interface Props {
  data: DimensionSummary[];
}

function fmt(n: number) {
  return n.toLocaleString("ar-LY", { maximumFractionDigits: 2 });
}

const PAGE_SIZE = 10;

export const VendorBreakdown = React.memo(function VendorBreakdown({
  data,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const maxTotal = data[0]?.total ?? 1;

  if (data.length === 0)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 text-center text-gray-400 text-sm">
        No vendor expenses recorded.
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
            className="ti ti-building-store text-gray-400 text-lg"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-gray-700">
            Cost by vendor
          </h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {data.length} vendors
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide w-1/3">
                Vendor
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Total
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Orders
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Avg
              </th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide w-28">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((row) => (
              <tr
                key={row.label}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <i
                        className="ti ti-building text-gray-400 text-sm"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="font-medium text-gray-700 truncate">
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                  {fmt(row.total)}
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    LYD
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-600">
                  {row.count}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-600">
                  {fmt(row.average)}
                  <span className="text-xs text-gray-400 ml-1">LYD</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{
                          width: `${Math.round((row.total / maxTotal) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                      {row.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200">
            <tr>
              <td className="px-5 py-3 text-xs font-semibold text-gray-500">
                Total
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                {fmt(data.reduce((s, r) => s + r.total, 0))} LYD
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
              : `Show ${data.length - PAGE_SIZE} more vendors`}
          </button>
        </div>
      )}
    </div>
  );
});
