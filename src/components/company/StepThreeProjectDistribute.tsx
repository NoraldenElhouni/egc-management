import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/helpper";
import {
  Currency,
  DistributionProject,
  calcEmployeeEarnings,
} from "../../hooks/projects/useProjectsDistribute";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

interface Props {
  projects: DistributionProject[];
}

interface EmployeeSummary {
  employeeId: string;
  name: string;
  totals: Record<Currency, number>;
  breakdown: {
    projectId: string;
    projectName: string;
    serialNumber: number | null;
    assignmentPct: number;
    earnings: Record<Currency, number>;
  }[];
}

function buildEmployeeSummaries(
  projects: DistributionProject[],
): EmployeeSummary[] {
  const map = new Map<string, EmployeeSummary>();

  projects.forEach((project) => {
    CURRENCIES.forEach((currency) => {
      const empEarnings = calcEmployeeEarnings(project, currency);

      empEarnings.forEach(({ employeeId, name, assignmentPct, earning }) => {
        if (!map.has(employeeId)) {
          map.set(employeeId, {
            employeeId,
            name,
            totals: { LYD: 0, USD: 0, EUR: 0 },
            breakdown: [],
          });
        }

        const summary = map.get(employeeId)!;
        summary.totals[currency] += earning;

        // Find or create breakdown entry for this project
        let breakdownEntry = summary.breakdown.find(
          (b) => b.projectId === project.id,
        );
        if (!breakdownEntry) {
          breakdownEntry = {
            projectId: project.id,
            projectName: project.name,
            serialNumber: project.serial_number,
            assignmentPct,
            earnings: { LYD: 0, USD: 0, EUR: 0 },
          };
          summary.breakdown.push(breakdownEntry);
        }
        breakdownEntry.earnings[currency] += earning;
      });
    });
  });

  // Sort by employee name
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

const StepThreeProjectDistribute = ({ projects }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const employees = useMemo(() => buildEmployeeSummaries(projects), [projects]);

  const grandTotals = useMemo(() => {
    const base: Record<Currency, number> = { LYD: 0, USD: 0, EUR: 0 };
    employees.forEach((e) => {
      CURRENCIES.forEach((c) => {
        base[c] += e.totals[c];
      });
    });
    return base;
  }, [employees]);

  return (
    <div className="p-3 flex justify-center">
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-fit table-auto text-sm m-4">
          <thead className="bg-gray-50">
            <tr className="text-right">
              <th className="px-3 py-2 font-semibold text-gray-700">#</th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                اسم الشريك
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700">LYD</th>
              <th className="px-3 py-2 font-semibold text-gray-700">USD</th>
              <th className="px-3 py-2 font-semibold text-gray-700">EUR</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {employees.map((emp, index) => {
              const isOpen = openId === emp.employeeId;

              return (
                <>
                  <tr
                    key={emp.employeeId}
                    onClick={() =>
                      setOpenId((p) =>
                        p === emp.employeeId ? null : emp.employeeId,
                      )
                    }
                    className={`cursor-pointer hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-900">
                          👤 {emp.name}
                        </span>
                        <span
                          className={`text-gray-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      </div>
                    </td>
                    {CURRENCIES.map((c) => (
                      <td key={c} className="px-3 py-2 tabular-nums">
                        {formatCurrency(emp.totals[c], c)}
                      </td>
                    ))}
                  </tr>

                  {isOpen && (
                    <tr key={`${emp.employeeId}-detail`}>
                      <td colSpan={5} className="px-3 py-3 bg-blue-50">
                        <div className="rounded-md border bg-white p-3">
                          <div className="mb-2 text-xs font-semibold text-gray-600">
                            تفاصيل الأرباح حسب المشروع
                          </div>

                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-right text-gray-500 bg-gray-50">
                                <th className="px-2 py-1">#</th>
                                <th className="px-2 py-1">المشروع</th>
                                <th className="px-2 py-1">النسبة %</th>
                                <th className="px-2 py-1">LYD</th>
                                <th className="px-2 py-1">USD</th>
                                <th className="px-2 py-1">EUR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {emp.breakdown.map((b) => (
                                <tr key={b.projectId} className="text-right">
                                  <td className="px-2 py-1 text-gray-400">
                                    {b.serialNumber}
                                  </td>
                                  <td className="px-2 py-1 font-medium">
                                    {b.projectName}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums">
                                    {b.assignmentPct}%
                                  </td>
                                  {CURRENCIES.map((c) => (
                                    <td
                                      key={c}
                                      className="px-2 py-1 tabular-nums"
                                    >
                                      {formatCurrency(b.earnings[c], c)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="text-right font-semibold bg-gray-50">
                                <td colSpan={3} className="px-2 py-1">
                                  الإجمالي
                                </td>
                                {CURRENCIES.map((c) => (
                                  <td
                                    key={c}
                                    className="px-2 py-1 tabular-nums"
                                  >
                                    {formatCurrency(emp.totals[c], c)}
                                  </td>
                                ))}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {/* Grand totals */}
            <tr className="bg-gray-100 font-semibold">
              <td></td>
              <td className="px-3 py-2 text-right">الإجمالي الكلي</td>
              {CURRENCIES.map((c) => (
                <td key={c} className="px-3 py-2 tabular-nums">
                  {formatCurrency(grandTotals[c], c)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StepThreeProjectDistribute;
