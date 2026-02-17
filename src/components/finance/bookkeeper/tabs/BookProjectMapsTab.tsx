import React from "react";
import GenericTable from "../../../tables/table";
import ProjectMapsForm from "../../form/ProjectMapsForm";
import { ProjectMaps } from "../../../../types/global.type";
import { ProjectMapsColumns } from "../../../tables/columns/ProjectMapsColumns";

interface BookProjectMapsTabProps {
  projectId: string;
  projectMaps: ProjectMaps[]; // Replace with actual type when available
}

const BookProjectMapsTab = ({
  projectId,
  projectMaps,
}: BookProjectMapsTabProps) => {
  return (
    <div className="space-y-4">
      <div>
        <ProjectMapsForm project_id={projectId} />
      </div>
      <GenericTable
        enableFiltering
        enableSorting
        showGlobalFilter
        enablePagination
        initialSorting={[{ id: "serial_number", desc: true }]}
        data={projectMaps || []}
        columns={ProjectMapsColumns}
      />
    </div>
  );
};

export default BookProjectMapsTab;
