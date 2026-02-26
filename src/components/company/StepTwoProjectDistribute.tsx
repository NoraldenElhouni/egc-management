import { useMemo, useState } from "react";
import { DistributionProject } from "../../types/projects.type";
import { formatCurrency } from "../../utils/helpper";
import { Currency } from "../../types/global.type";

type Props = {
  projects: DistributionProject[] | null;
};

interface ProjectAmountRow {
  projectId: string;
  projectName: string;
  serialNumber: number;
  currency: Currency;
  type: string;
  period_percentage: number;
  percentage: number;
  amount: number;
}

interface GroupedEmployee {
  employeeId: string;
  employeeName: string;
  rows: ProjectAmountRow[];
  totals: Record<Currency, number>;
}

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

const StepTwoProjectDistribute = ({ projects }: Props) => {
  const [openEmployeeId, setOpenEmployeeId] = useState<string | null>(null);

  const grouped = useMemo<GroupedEmployee[]>(() => {
    const map = new Map<string, GroupedEmployee>();

    (projects ?? []).forEach((project) => {
      (project.project_assignments ?? []).forEach((assignment) => {
        // employees is typed as Employees[] from your hook mapping
        const employee = Array.isArray(assignment.employees)
          ? assignment.employees[0]
          : assignment.employees;

        if (!employee) return;

        const employeeId = employee.id;

        if (!map.has(employeeId)) {
          map.set(employeeId, {
            employeeId,
            employeeName:
              `${employee.first_name} ${employee.last_name ?? ""}`.trim(),
            rows: [],
            totals: { LYD: 0, USD: 0, EUR: 0 },
          });
        }

        const entry = map.get(employeeId)!;

        (project.project_percentage ?? []).forEach((pp) => {
          const currency = (pp.currency ?? "LYD") as Currency;
          const amount =
            (Number(assignment.percentage) / 100) *
            Number(pp.period_percentage);

          entry.rows.push({
            projectId: project.id,
            projectName: project.name,
            serialNumber: project.serial_number ?? 0,
            currency,
            type: pp.type ?? "cash",
            period_percentage: Number(pp.period_percentage),
            percentage: Number(assignment.percentage),
            amount,
          });

          entry.totals[currency] = (entry.totals[currency] ?? 0) + amount;
        });
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }, [projects]);

  if (!projects || projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-4 rounded-md border bg-white p-4 text-center text-gray-500 text-sm">
        لا توجد مشاريع
      </div>
    );
  }

  const toggle = (id: string) =>
    setOpenEmployeeId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-4xl mx-auto mt-4 space-y-2">
      <h2 className="text-base font-bold mb-3">مراجعة توزيع الموظفين</h2>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-right">
            <tr>
              <th className="px-4 py-2 font-semibold text-gray-600 w-8" />
              <th className="px-4 py-2 font-semibold text-gray-600">
                اسم الموظف
              </th>
              {CURRENCIES.map((cur) => (
                <th key={cur} className="px-4 py-2 font-semibold text-gray-600">
                  {cur}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {grouped.map((emp) => {
              const isOpen = openEmployeeId === emp.employeeId;

              return (
                <>
                  {/* Employee summary row */}
                  <tr
                    key={emp.employeeId}
                    onClick={() => toggle(emp.employeeId)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-center">
                      <span
                        className={`inline-block transition-transform duration-200 text-xs ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {emp.employeeName}
                    </td>
                    {CURRENCIES.map((cur) => (
                      <td
                        key={cur}
                        className="px-4 py-3 tabular-nums text-gray-700"
                      >
                        {emp.totals[cur] > 0 ? (
                          formatCurrency(emp.totals[cur], cur)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Collapsible project breakdown */}
                  {isOpen && (
                    <tr key={`${emp.employeeId}-details`}>
                      <td
                        colSpan={2 + CURRENCIES.length}
                        className="bg-blue-50 px-6 py-3"
                      >
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-right text-gray-500 border-b border-blue-100">
                              <th className="pb-1 pr-2">#</th>
                              <th className="pb-1 pr-2">المشروع</th>
                              <th className="pb-1 pr-2">العملة</th>
                              <th className="pb-1 pr-2">نوع</th>
                              <th className="pb-1 pr-2">قيمة الفترة</th>
                              <th className="pb-1 pr-2">نسبة الموظف</th>
                              <th className="pb-1 pr-2 font-semibold text-gray-700">
                                المبلغ
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-100">
                            {emp.rows.map((row, i) => (
                              <tr
                                key={`${row.projectId}-${row.currency}-${i}`}
                                className="text-right"
                              >
                                <td className="py-1.5 pr-2 text-gray-400">
                                  {row.serialNumber}
                                </td>
                                <td className="py-1.5 pr-2 font-medium text-gray-700">
                                  {row.projectName}
                                </td>
                                <td className="py-1.5 pr-2">{row.currency}</td>
                                <td className="py-1.5 pr-2">
                                  {row.type === "cash" ? "نقد" : "بنك"}
                                </td>
                                <td className="py-1.5 pr-2 tabular-nums">
                                  {formatCurrency(
                                    row.period_percentage,
                                    row.currency,
                                  )}
                                </td>
                                <td className="py-1.5 pr-2 tabular-nums">
                                  {row.percentage}%
                                </td>
                                <td className="py-1.5 pr-2 tabular-nums font-semibold text-gray-800">
                                  {formatCurrency(row.amount, row.currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>

                          {/* Subtotals inside the breakdown */}
                          <tfoot>
                            <tr className="border-t border-blue-200">
                              <td
                                colSpan={5}
                                className="pt-2 pr-2 text-gray-400 text-xs"
                              >
                                الإجمالي
                              </td>
                              {CURRENCIES.filter((c) => emp.totals[c] > 0).map(
                                (cur) => (
                                  <td
                                    key={cur}
                                    colSpan={1}
                                    className="pt-2 pr-2 tabular-nums font-bold text-gray-800"
                                  >
                                    {formatCurrency(emp.totals[cur], cur)}
                                  </td>
                                ),
                              )}
                            </tr>
                          </tfoot>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>

          {/* Grand totals */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr className="text-right font-semibold">
              <td />
              <td className="px-4 py-3 text-gray-700">الإجمالي الكلي</td>
              {CURRENCIES.map((cur) => {
                const total = grouped.reduce(
                  (sum, e) => sum + (e.totals[cur] ?? 0),
                  0,
                );
                return (
                  <td key={cur} className="px-4 py-3 tabular-nums">
                    {total > 0 ? (
                      formatCurrency(total, cur)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default StepTwoProjectDistribute;
