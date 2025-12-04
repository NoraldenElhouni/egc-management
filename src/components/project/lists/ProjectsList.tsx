import { useMemo } from "react";
import { useProjects } from "../../../hooks/useProjects";
import { createProjectsColumns } from "../../tables/columns/ProjectsColumns";
import GenericTable from "../../tables/table";

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

  return (
    <div>
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
