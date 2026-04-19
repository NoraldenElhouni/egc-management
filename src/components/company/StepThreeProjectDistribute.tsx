import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/helpper";
import {
  Currency,
  DistributionProject,
  calcEmployeeEarnings,
  calcDistribution,
} from "../../hooks/projects/useProjectsDistribute";
import ProjectDistributionPercentageDialog from "./distribution/ProjectDistributionPercentageDialog";

const CURRENCIES: Currency[] = ["LYD", "USD", "EUR"];

interface Props {
  projects: DistributionProject[];
  onRefetch: () => void;
}

type PartyType = "employee" | "bank" | "company";

interface PartySummary {
  id: string;
  name: string;
  type: PartyType;
  totals: Record<Currency, number>;
  breakdown: {
    projectId: string;
    projectName: string;
    serialNumber: number | null;
    assignmentPct: number;
    earnings: Record<Currency, number>;
  }[];
}

function buildSummaries(projects: DistributionProject[]): PartySummary[] {
  const map = new Map<string, PartySummary>();

  const ensureParty = (
    id: string,
    name: string,
    type: PartyType,
  ): PartySummary => {
    if (!map.has(id)) {
      map.set(id, {
        id,
        name,
        type,
        totals: { LYD: 0, USD: 0, EUR: 0 },
        breakdown: [],
      });
    }
    const party = map.get(id);
    if (!party) throw new Error(`Party with id ${id} not found`);
    return party;
  };

  const addBreakdown = (
    party: PartySummary,
    project: DistributionProject,
    assignmentPct: number,
    currency: Currency,
    amount: number,
  ) => {
    party.totals[currency] += amount;
    let entry = party.breakdown.find((b) => b.projectId === project.id);
    if (!entry) {
      entry = {
        projectId: project.id,
        projectName: project.name,
        serialNumber: project.serial_number,
        assignmentPct,
        earnings: { LYD: 0, USD: 0, EUR: 0 },
      };
      party.breakdown.push(entry);
    }
    entry.earnings[currency] += amount;
  };

  projects.forEach((project) => {
    CURRENCIES.forEach((currency) => {
      const dist = calcDistribution(project, currency);
      if (dist.total === 0) return;

      addBreakdown(
        ensureParty("__bank__", "🏦 البنك / الاحتياطي", "bank"),
        project,
        Number(project.default_bank_percentage),
        currency,
        dist.bank,
      );

      addBreakdown(
        ensureParty("__company__", "🏢 الشركة", "company"),
        project,
        Number(project.default_company_percentage),
        currency,
        dist.company,
      );

      calcEmployeeEarnings(project, currency).forEach(
        ({ employeeId, name, assignmentPct, earning }) => {
          addBreakdown(
            ensureParty(employeeId, `👤 ${name}`, "employee"),
            project,
            assignmentPct,
            currency,
            earning,
          );
        },
      );
    });
  });

  const bank = map.get("__bank__");
  const company = map.get("__company__");
  const employees = Array.from(map.values())
    .filter((p) => p.type === "employee")
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...(bank ? [bank] : []), ...(company ? [company] : []), ...employees];
}

const rowBg: Record<PartyType, string> = {
  bank: "bg-yellow-50",
  company: "bg-green-50",
  employee: "bg-white",
};
const altRowBg: Record<PartyType, string> = {
  bank: "bg-yellow-50",
  company: "bg-green-50",
  employee: "bg-gray-50",
};

const StepThreeProjectDistribute = ({ projects, onRefetch }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogProject, setDialogProject] =
    useState<DistributionProject | null>(null);

  const parties = useMemo(() => buildSummaries(projects), [projects]);

  const grandTotals = CURRENCIES.reduce(
    (acc, c) => {
      acc[c] = parties.reduce((sum, p) => sum + p.totals[c], 0);
      return acc;
    },
    {} as Record<Currency, number>,
  );

  const handleProjectClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row toggle
    const found = projects.find((p) => p.id === projectId);
    if (found) setDialogProject(found);
  };

  return (
    <div className="p-3 flex justify-center">
      {/* Controlled dialog — rendered once at top level */}
      {dialogProject && (
        <ProjectDistributionPercentageDialog
          project={dialogProject}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDialogProject(null);
          }}
          onSave={() => {
            // ← add this
            setDialogProject(null);
            onRefetch();
          }}
        />
      )}

      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="w-fit table-auto text-sm m-4">
          <thead className="bg-gray-50">
            <tr className="text-right">
              <th className="px-3 py-2 font-semibold text-gray-700">#</th>
              <th className="px-3 py-2 font-semibold text-gray-700">الجهة</th>
              {CURRENCIES.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold text-gray-700">
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {parties.map((party, index) => {
              const isOpen = openId === party.id;
              const bg =
                index % 2 === 0 ? rowBg[party.type] : altRowBg[party.type];

              return (
                <>
                  <tr
                    key={party.id}
                    onClick={() =>
                      setOpenId((p) => (p === party.id ? null : party.id))
                    }
                    className={`cursor-pointer hover:brightness-95 ${bg}`}
                  >
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-900">
                          {party.name}
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
                        {formatCurrency(party.totals[c], c)}
                      </td>
                    ))}
                  </tr>

                  {isOpen && (
                    <tr key={`${party.id}-detail`}>
                      <td colSpan={5} className="px-3 py-3 bg-blue-50">
                        <div className="rounded-md border bg-white p-3">
                          <p className="mb-2 text-xs font-semibold text-gray-600">
                            التفاصيل حسب المشروع
                          </p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-right text-gray-500 bg-gray-50">
                                <th className="px-2 py-1">#</th>
                                <th className="px-2 py-1">المشروع</th>
                                <th className="px-2 py-1">النسبة %</th>
                                {CURRENCIES.map((c) => (
                                  <th key={c} className="px-2 py-1">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {party.breakdown.map((b) => (
                                <tr
                                  key={b.projectId}
                                  className="text-right hover:bg-blue-50 cursor-pointer group"
                                  onClick={(e) =>
                                    handleProjectClick(b.projectId, e)
                                  }
                                  title="انقر لعرض تفاصيل التوزيع"
                                >
                                  <td className="px-2 py-1 text-gray-400">
                                    {b.serialNumber}
                                  </td>
                                  <td className="px-2 py-1 font-medium">
                                    <div className="flex items-center justify-between gap-2">
                                      <span>{b.projectName}</span>
                                      <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                        🔍
                                      </span>
                                    </div>
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
                                    {formatCurrency(party.totals[c], c)}
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
