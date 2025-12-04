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
    [basePath, version]
  );

  const lydBalance = projects?.map((project) =>
    project.project_balances?.reduce((acc, balance) => {
      if (balance.currency === "LYD") {
        return acc + (balance.balance || 0);
      }
      return acc;
    }, 0)
  );

  // const lydTotalPercentages = projects?.map((project) =>
  //   project.project_percentage?.reduce((acc, percentage) => {
  //     if (percentage.currency === "LYD") {
  //       return acc + (percentage.total_percentage || 0);
  //     }
  //     return acc;
  //   }, 0)
  // );

  const totalActiveProjects =
    projects?.reduce(
      (acc, project) => acc + (project.status === "active" ? 1 : 0),
      0
    ) || 0;

  return (
    <div>
      <div>
        {version === "finance" ? (
          <div>
            {" "}
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
                  value: formatCurrency(
                    lydBalance?.reduce((acc, val) => acc + (val || 0), 0) ?? 0,
                    "LYD"
                  ),
                  icon: DollarSign,
                  iconBgColor: "bg-green-100",
                  iconColor: "text-green-600",
                },
                {
                  label: "",
                  value: 0,
                  icon: Workflow,
                  iconBgColor: "bg-orange-100",
                  iconColor: "text-orange-600",
                },
                {
                  label: "",
                  value: 0,
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
