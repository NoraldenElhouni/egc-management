import React, { useMemo } from "react";
import { useProjectsDistribute } from "../../hooks/projects/useProjectsDistribute";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";

type Currency = "LYD" | "USD" | "EUR";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

const ProjectsDistributePage = () => {
  const { projects, loading, error } = useProjectsDistribute();

  const { rows, totals } = useMemo(() => {
    const rows =
      projects?.map((p) => {
        const byCurrency: Record<Currency, number> = { LYD: 0, USD: 0, EUR: 0 };

        for (const pp of p.project_percentage ?? []) {
          const c = pp.currency as Currency | null;
          if (c && CURRENCIES.includes(c)) {
            byCurrency[c] += Number(pp.period_percentage ?? 0);
          }
        }

        return {
          key: p.id,
          name: p.name,
          ...byCurrency,
        };
      }) ?? [];

    const totals = rows.reduce(
      (acc, r) => {
        acc.LYD += r.LYD;
        acc.USD += r.USD;
        acc.EUR += r.EUR;
        return acc;
      },
      { LYD: 0, USD: 0, EUR: 0 },
    );

    return { rows, totals };
  }, [projects]);

  if (loading) return <LoadingPage label="جاري تحميل معلومات المشاريع" />;

  if (error) {
    return (
      <ErrorPage
        error={error.message || "حدث خطأ أثناء تحميل معلومات المشاريع"}
        label="صفحة توزيع المشاريع"
      />
    );
  }

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-700">
              <th className="border-b px-4 py-3 font-semibold">المشروع</th>
              <th className="border-b px-4 py-3 font-semibold">LYD</th>
              <th className="border-b px-4 py-3 font-semibold">USD</th>
              <th className="border-b px-4 py-3 font-semibold">EUR</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="hover:bg-gray-50">
                  <td className="border-b px-4 py-3">{r.name}</td>
                  <td className="border-b px-4 py-3">{r.LYD}</td>
                  <td className="border-b px-4 py-3">{r.USD}</td>
                  <td className="border-b px-4 py-3">{r.EUR}</td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot className="bg-gray-50">
            <tr>
              <td className="border-t px-4 py-3 font-bold">الإجمالي</td>
              <td className="border-t px-4 py-3 font-bold">{totals.LYD}</td>
              <td className="border-t px-4 py-3 font-bold">{totals.USD}</td>
              <td className="border-t px-4 py-3 font-bold">{totals.EUR}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ProjectsDistributePage;
