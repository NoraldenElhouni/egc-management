import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/helpper";
import { Currency } from "../../types/global.type";
import { DistributionProject } from "../../types/projects.type";

const sumByCurrency = (
  rows: { currency: Currency | null; period_percentage: number }[],
  currency: Currency,
) =>
  rows
    ?.filter((r) => r.currency === currency)
    .reduce((sum, r) => sum + (Number(r.period_percentage) || 0), 0) ?? 0;

interface SetpOneProjectDistibuteProps {
  projects: DistributionProject[] | null;
}

const SetpOneProjectDistibute = ({
  projects,
}: SetpOneProjectDistibuteProps) => {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const base = { LYD: 0, USD: 0, EUR: 0 };
    (projects ?? []).forEach((p) => {
      const rows = p.project_percentage ?? [];
      base.LYD += sumByCurrency(rows, "LYD");
      base.USD += sumByCurrency(rows, "USD");
      base.EUR += sumByCurrency(rows, "EUR");
    });
    return base;
  }, [projects]);

  const handleProjectClick = (projectId: string) => {
    setOpenProjectId((prev) => (prev === projectId ? null : projectId));
  };
  return (
    <div>
      {" "}
      <div className="p-3 flex justify-center">
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="w-fit table-auto text-sm m-4 p-4">
            <thead className="bg-gray-50">
              <tr className="text-right">
                <th className="px-3 py-2 font-semibold text-gray-700">#</th>
                <th className="px-3 py-2 font-semibold text-gray-700">
                  اسم المشروع
                </th>
                <th className="px-3 py-2 font-semibold text-gray-700">LYD</th>
                <th className="px-3 py-2 font-semibold text-gray-700">USD</th>
                <th className="px-3 py-2 font-semibold text-gray-700">EUR</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {(projects ?? []).map((project, index) => {
                const rows = project.project_percentage ?? [];
                const LYD = sumByCurrency(rows, "LYD");
                const USD = sumByCurrency(rows, "USD");
                const EUR = sumByCurrency(rows, "EUR");
                const isOpen = openProjectId === project.id;

                return (
                  <>
                    <tr
                      onClick={() => handleProjectClick(project.id)}
                      key={project.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-gray-500">
                          {project.serial_number}
                        </span>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-gray-900">
                            {project.name}
                          </span>

                          {/* simple chevron */}
                          <span
                            className={`text-gray-400 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            ▼
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2 tabular-nums">
                        {formatCurrency(LYD, "LYD")}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatCurrency(USD, "USD")}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatCurrency(EUR, "EUR")}
                      </td>
                    </tr>

                    {/* Collapsible details row */}
                    {isOpen && (
                      <tr key={`${project.id}-details`} className="bg-gray-50">
                        <td colSpan={5} className="px-3 py-3">
                          <div className="rounded-md border bg-white p-3">
                            <div className="mb-2 text-xs font-semibold text-gray-600">
                              تفاصيل النِسب حسب العملة
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <div className="rounded-md border p-2">
                                <div className="text-xs text-gray-500">LYD</div>
                                <div className="mt-1 tabular-nums font-semibold">
                                  {formatCurrency(LYD, "LYD")}
                                </div>
                              </div>

                              <div className="rounded-md border p-2">
                                <div className="text-xs text-gray-500">USD</div>
                                <div className="mt-1 tabular-nums font-semibold">
                                  {formatCurrency(USD, "USD")}
                                </div>
                              </div>

                              <div className="rounded-md border p-2">
                                <div className="text-xs text-gray-500">EUR</div>
                                <div className="mt-1 tabular-nums font-semibold">
                                  {formatCurrency(EUR, "EUR")}
                                </div>
                              </div>
                            </div>

                            {/* Optional: show the raw rows */}
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-right text-gray-600">
                                    <th className="px-2 py-1">العملة</th>
                                    <th className="px-2 py-1">نوع الحساب</th>
                                    <th className="px-2 py-1">
                                      القيمة المئوية للفترة (%)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {rows.map((r) => (
                                    <tr key={r.id} className="text-right">
                                      <td className="px-2 py-1">
                                        {r.currency}
                                      </td>
                                      <td className="px-2 py-1">
                                        {r.type === "cash" ? "نقد" : "بنك"}
                                      </td>
                                      <td className="px-2 py-1 tabular-nums">
                                        {formatCurrency(
                                          r.period_percentage,
                                          r.currency ?? "LYD",
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {/* Totals row */}
              <tr className="bg-gray-50 font-semibold">
                <td></td>
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatCurrency(totals.LYD, "LYD")}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatCurrency(totals.USD, "USD")}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatCurrency(totals.EUR, "EUR")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SetpOneProjectDistibute;
