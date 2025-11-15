import React from "react";
import GenericTable from "../tables/table";
import { ProjectsColumns } from "../tables/columns/ProjectsColumns";
import { useProjects } from "../../hooks/useProjects";

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
