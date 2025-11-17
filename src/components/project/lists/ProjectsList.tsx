import { useProjects } from "../../../hooks/useProjects";
import { ProjectsColumns } from "../../tables/columns/ProjectsColumns";
import GenericTable from "../../tables/table";

const ProjectsList = () => {
  const { projects } = useProjects();
  return (
    <div>
      <GenericTable
        data={projects}
        columns={ProjectsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default ProjectsList;
