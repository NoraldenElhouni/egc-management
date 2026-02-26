import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/helpper";
import {
  Currency,
  DistributionProject,
  getPeriodTotal,
} from "../../hooks/projects/useProjectsDistribute";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

interface Props {
  projects: DistributionProject[];
}

const StepOneProjectDistribute = ({ projects }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const base = { LYD: 0, USD: 0, EUR: 0 };
    projects.forEach((p) => {
      CURRENCIES.forEach((c) => {
        base[c] += getPeriodTotal(p.project_percentage, c);
      });
    });
    return base;
  }, [projects]);

  return (
    <div className="p-3 flex justify-center">
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-fit table-auto text-sm m-4">
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
            {projects.map((project, index) => {
              const isOpen = openId === project.id;
              const rows = project.project_percentage ?? [];

              return (
                <>
                  <tr
                    key={project.id}
                    onClick={() =>
                      setOpenId((p) => (p === project.id ? null : project.id))
                    }
                    className={`cursor-pointer hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
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
                          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </div>
                    </td>
                    {CURRENCIES.map((c) => (
                      <td key={c} className="px-3 py-2 tabular-nums">
                        {formatCurrency(getPeriodTotal(rows, c), c)}
                      </td>
                    ))}
                  </tr>

                  {isOpen && (
                    <tr key={`${project.id}-detail`}>
                      <td colSpan={5} className="px-3 py-3 bg-blue-50">
                        <div className="rounded-md border bg-white p-3">
                          <div className="mb-2 text-xs font-semibold text-gray-600">
                            تفاصيل النِسب حسب العملة والنوع
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-right text-gray-500 bg-gray-50">
                                  <th className="px-2 py-1">العملة</th>
                                  <th className="px-2 py-1">نوع الحساب</th>
                                  <th className="px-2 py-1">
                                    القيمة المئوية للفترة
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {rows.map((r) => (
                                  <tr key={r.id} className="text-right">
                                    <td className="px-2 py-1">{r.currency}</td>
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

            {/* Totals */}
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

export default StepOneProjectDistribute;
