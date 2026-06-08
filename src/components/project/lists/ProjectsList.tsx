import { useMemo } from "react";
import { useProjects } from "../../../hooks/useProjects";
import { createProjectsColumns } from "../../tables/columns/ProjectsColumns";
import GenericTable from "../../tables/table";
import OverviewStatus from "../../ui/OverviewStatus";
import { formatCurrency } from "../../../utils/helpper";

interface ProjectsListProps {
  basePath?: string;
  version?: string;
}

const ProjectsList = ({
  basePath = "/projects",
  version = "default",
}: ProjectsListProps) => {
  const { projects } = useProjects();

  const columns = useMemo(
    () => createProjectsColumns((id) => `${basePath}/${id}`, version),
    [basePath, version],
  );

  // -----------------------------
  // ❌ EXCLUDED TEST PROJECT IDS
  // -----------------------------
  const excludedProjectIds = [
    "eed51009-4cfa-497c-87a1-cbf5a756f3da",
    "e0a50575-bcc1-474a-98b8-8f57770a14fa",
    "5451aaae-c632-46f4-9913-8670cffcc8e7",
  ];

  // -----------------------------
  // FILTER PROJECTS
  // -----------------------------
  const filteredProjects =
    projects?.filter((p) => !excludedProjectIds.includes(p.id)) || [];

  // -----------------------------
  // FLATTEN ACCOUNTS
  // -----------------------------
  const allAccounts = filteredProjects
    .flatMap((p) => p.accounts || [])
    .filter(Boolean);

  // -----------------------------
  // STATS
  // -----------------------------
  const totalActiveProjects = filteredProjects.reduce(
    (acc, project) => acc + (project.status === "active" ? 1 : 0),
    0,
  );

  const totalBalance = allAccounts.reduce(
    (acc, a) => acc + (a.balance || 0),
    0,
  );

  const totalCashBalance = allAccounts
    .filter((a) => a.type === "cash")
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalBankBalance = allAccounts
    .filter((a) => a.type === "bank")
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalIncome = allAccounts.reduce(
    (acc, a) => acc + (a.total_transactions || 0),
    0,
  );

  const totalExpense = allAccounts.reduce(
    (acc, a) => acc + (a.total_expense || 0),
    0,
  );

  const totalPercentages = allAccounts.reduce(
    (acc, a) => acc + (a.total_percentage || 0),
    0,
  );

  return (
    <div>
      {version === "finance" && (
        <OverviewStatus
          stats={[
            {
              label: "عدد المشاريع النشطة",
              value: totalActiveProjects,
            },
            {
              label: "اجمالي المصاريف",
              value: formatCurrency(totalExpense),
              secondaryLabel: "النسبة",
              secondaryValue: formatCurrency(totalPercentages),
            },
            {
              label: "اجمالي المدفوع",
              value: formatCurrency(totalIncome),
            },
            {
              label: "الرصيد المتاح",
              value: formatCurrency(totalBalance),
              secondaryLabel: "كاش",
              secondaryValue: formatCurrency(totalCashBalance),
              tertiaryLabel: "بنك",
              tertiaryValue: formatCurrency(totalBankBalance),
            },
          ]}
        />
      )}

      <GenericTable
        data={projects ?? []}
        columns={columns}
        enableSorting
        enableFiltering
        showGlobalFilter
        initialSorting={[{ id: "serial_number", desc: true }]}
      />
    </div>
  );
};

export default ProjectsList;
