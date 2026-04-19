import { useState } from "react";
import { formatCurrency } from "../../utils/helpper";
import {
  Currency,
  DistributionProject,
  getPeriodTotal,
  calcDistribution,
  calcEmployeeEarnings,
} from "../../hooks/projects/useProjectsDistribute";
import ProjectDistributionPercentageDialog from "./distribution/ProjectDistributionPercentageDialog";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

interface Props {
  projects: DistributionProject[];
  onRefetch: () => void;
}

const StepTwoProjectDistribute = ({ projects, onRefetch }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const totals = CURRENCIES.reduce(
    (acc, c) => {
      acc[c] = projects.reduce(
        (sum, p) => sum + getPeriodTotal(p.project_percentage, c),
        0,
      );
      return acc;
    },
    {} as Record<Currency, number>,
  );

  return (
    <div className="p-3 flex justify-center">
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-fit table-auto text-sm m-4">
          <thead className="bg-blue-50">
            <tr className="text-right">
              <th className="px-3 py-2 font-semibold text-blue-800">#</th>
              <th className="px-3 py-2 font-semibold text-blue-800">
                اسم المشروع
              </th>
              {CURRENCIES.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold text-blue-800">
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {projects.map((project, index) => {
              const isOpen = openId === project.id;

              return (
                <>
                  <tr
                    key={project.id}
                    onClick={() =>
                      setOpenId((p) => (p === project.id ? null : project.id))
                    }
                    className={`cursor-pointer hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {project.serial_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-900">
                          {project.name}
                        </span>
                        <span
                          className={`text-blue-400 transition-transform duration-200 text-base ${isOpen ? "rotate-180" : ""}`}
                        >
                          🔍
                        </span>
                      </div>
                    </td>
                    {CURRENCIES.map((c) => (
                      <td key={c} className="px-3 py-2 tabular-nums">
                        {formatCurrency(
                          getPeriodTotal(project.project_percentage, c),
                          c,
                        )}
                      </td>
                    ))}
                  </tr>

                  {isOpen && (
                    <tr key={`${project.id}-detail`}>
                      <td colSpan={5} className="px-3 py-3 bg-blue-50">
                        <div className="rounded-md border bg-white p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600">
                              توزيع الفترة — بالعملة
                            </p>
                            <ProjectDistributionPercentageDialog
                              project={project}
                              onSave={onRefetch} // ← add this
                            />
                          </div>

                          {CURRENCIES.map((currency) => {
                            const dist = calcDistribution(project, currency);
                            if (dist.total === 0) return null;

                            const employees = calcEmployeeEarnings(
                              project,
                              currency,
                            );
                            const pctSum =
                              Number(project.default_bank_percentage) +
                              Number(project.default_company_percentage) +
                              employees.reduce(
                                (s, e) => s + e.assignmentPct,
                                0,
                              );

                            return (
                              <div
                                key={currency}
                                className="rounded-md border p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                    {currency}
                                  </span>
                                  <span className="text-xs font-semibold tabular-nums text-gray-700">
                                    الإجمالي:{" "}
                                    {formatCurrency(dist.total, currency)}
                                  </span>
                                </div>

                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-right text-gray-500 bg-gray-50">
                                      <th className="px-2 py-1">الجهة</th>
                                      <th className="px-2 py-1">النسبة %</th>
                                      <th className="px-2 py-1">المبلغ</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    <tr className="text-right bg-yellow-50">
                                      <td className="px-2 py-1 font-medium">
                                        🏦 البنك / الاحتياطي
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {project.default_bank_percentage}%
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {formatCurrency(dist.bank, currency)}
                                      </td>
                                    </tr>
                                    <tr className="text-right bg-green-50">
                                      <td className="px-2 py-1 font-medium">
                                        🏢 الشركة
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {project.default_company_percentage}%
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {formatCurrency(dist.company, currency)}
                                      </td>
                                    </tr>
                                    {employees.map((emp) => (
                                      <tr
                                        key={emp.employeeId}
                                        className="text-right"
                                      >
                                        <td className="px-2 py-1">
                                          👤 {emp.name}
                                        </td>
                                        <td className="px-2 py-1 tabular-nums">
                                          {emp.assignmentPct}%
                                        </td>
                                        <td className="px-2 py-1 tabular-nums">
                                          {formatCurrency(
                                            emp.earning,
                                            currency,
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="text-right font-semibold bg-gray-50">
                                      <td className="px-2 py-1" colSpan={2}>
                                        المجموع ({pctSum.toFixed(1)}%)
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {formatCurrency(dist.total, currency)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            <tr className="bg-gray-100 font-semibold">
              <td></td>
              <td className="px-3 py-2 text-right">الإجمالي</td>
              {CURRENCIES.map((c) => (
                <td key={c} className="px-3 py-2 tabular-nums">
                  {formatCurrency(totals[c], c)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StepTwoProjectDistribute;
