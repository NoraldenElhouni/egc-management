import React from "react";
import { useParams } from "react-router-dom";
import ProjectPercentageDistributionForm from "../../../../components/hr/form/ProjectPercentageDistributionForm";

const ProjectPercentagesPayrollPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) {
    return <div>رقم المشروع غير موجود في الرابط.</div>;
  }

  return (
    <div className="p-4">
      <ProjectPercentageDistributionForm projectId={projectId} />
    </div>
  );
};

export default ProjectPercentagesPayrollPage;
