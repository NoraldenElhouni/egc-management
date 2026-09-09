import React from "react";
import ProjectsList from "../../../components/project/lists/ProjectsList";

const OperationsBIQPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList
        basePath="/operations/boq/project"
        version="compact"
        counters={[
          {
            id: "boq_zones_count",
            header: "عدد المناطق",
            table: "zones",
            schema: "boq",
          },
        ]}
      />
    </div>
  );
};

export default OperationsBIQPage;
