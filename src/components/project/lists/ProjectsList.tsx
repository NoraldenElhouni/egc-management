import { useMemo } from "react";
import { useProjects } from "../../../hooks/useProjects";
import { createProjectsColumns } from "../../tables/columns/ProjectsColumns";
import GenericTable from "../../tables/table";
import OverviewStatus from "../../ui/OverviewStatus";
import { DollarSign, Target, Workflow } from "lucide-react";
import { formatCurrency } from "../../../utils/helpper";

interface ProjectsListProps {
  basePath?: string; // Renamed for clarity
  version?: string;
}

const ProjectsList = ({
  basePath = "/projects",
  version = "default",
}: ProjectsListProps) => {
  const { projects } = useProjects();

  // Create columns with the desired link path
  const columns = useMemo(
    () => createProjectsColumns((id) => `${basePath}/${id}`, version),
    [basePath, version],
  );

  const totalActiveProjects =
    projects?.reduce(
      (acc, project) => acc + (project.status === "active" ? 1 : 0),
      0,
    ) || 0;

  const totalBalance =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.accounts?.reduce(
          (bAcc, balance) => bAcc + (balance.balance || 0),
          0,
        ) || 0),
      0,
    ) || 0;

  const totalIncome =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.accounts?.reduce(
          (bAcc, balance) => bAcc + (balance.total_transactions || 0),
          0,
        ) || 0),
      0,
    ) || 0;

  const totalExpense =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.accounts?.reduce(
          (bAcc, balance) => bAcc + (balance.total_expense || 0),
          0,
        ) || 0),
      0,
    ) || 0;

  const totalPercentages =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.accounts?.reduce(
          (bAcc, balance) => bAcc + (balance.total_percentage || 0),
          0,
        ) || 0),
      0,
    ) || 0;

  return (
    <div>
      <div>
        {version === "finance" ? (
          <div>
            <OverviewStatus
              stats={[
                {
                  label: "عدد المشاريع النشطة",
                  value: totalActiveProjects,
                  icon: Target,
                  iconBgColor: "bg-blue-100",
                  iconColor: "text-blue-600",
                },
                {
                  label: "اجمالي المصاريف",
                  value: formatCurrency(totalExpense),
                  icon: DollarSign,
                  iconBgColor: "bg-green-100",
                  iconColor: "text-green-600",
                  secondaryLabel: "النسبة",
                  secondaryValue: formatCurrency(totalPercentages),
                },

                {
                  label: "اجمالي الايرادات",
                  value: formatCurrency(totalIncome),
                  icon: DollarSign,
                  iconBgColor: "bg-green-100",
                  iconColor: "text-green-600",
                },
                {
                  label: "الرصيد المتاح",
                  value: formatCurrency(totalBalance),
                  icon: Workflow,
                  iconBgColor: "bg-orange-100",
                  iconColor: "text-orange-600",
                },
              ]}
            />
          </div>
        ) : null}
      </div>
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
