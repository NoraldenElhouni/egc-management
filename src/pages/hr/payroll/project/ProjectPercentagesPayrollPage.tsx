import React from "react";
import { useParams } from "react-router-dom";

const ProjectPercentagesPayrollPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) {
    return <div>رقم المشروع غير موجود في الرابط.</div>;
  }

  return <div>ProjectPercentagesPayrollPage for project ID: {projectId}</div>;
};

export default ProjectPercentagesPayrollPage;
