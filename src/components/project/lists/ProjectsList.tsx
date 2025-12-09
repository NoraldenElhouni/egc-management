import { useMemo } from "react";
import { useProjects } from "../../../hooks/useProjects";
import { createProjectsColumns } from "../../tables/columns/ProjectsColumns";
import GenericTable from "../../tables/table";
import OverviewStatus from "../../ui/OverviewStatus";
import { DollarSign, Target, Workflow } from "lucide-react";

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
    [basePath, version]
  );

  const totalActiveProjects =
    projects?.reduce(
      (acc, project) => acc + (project.status === "active" ? 1 : 0),
      0
    ) || 0;

  const totalBalance =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.project_balances?.reduce(
          (bAcc, balance) => bAcc + (balance.balance || 0),
          0
        ) || 0),
      0
    ) || 0;

  const totalHeld =
    projects?.reduce(
      (acc, project) =>
        acc +
        (project.project_balances?.reduce(
          (hAcc, held) => hAcc + (held.held || 0),
          0
        ) || 0),
      0
    ) || 0;

  const toalAvailable = totalBalance - totalHeld;

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
                  label: "الرصيد الحالي",
                  value: totalBalance,
                  icon: DollarSign,
                  iconBgColor: "bg-green-100",
                  iconColor: "text-green-600",
                },
                {
                  label: "الرصيد المتاح",
                  value: toalAvailable,
                  icon: Workflow,
                  iconBgColor: "bg-orange-100",
                  iconColor: "text-orange-600",
                },
                {
                  label: "الرصيد المحتجز",
                  value: totalHeld,
                  icon: DollarSign,
                  iconBgColor: "bg-green-100",
                  iconColor: "text-green-600",
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
