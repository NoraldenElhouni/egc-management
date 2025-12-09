import { useParams } from "react-router-dom";
import ProjectMapsDistributionForm from "../../../../components/hr/form/ProjectMapsDistributionForm";

const ProjectMapsPayrollPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) {
    return <div>رقم المشروع غير موجود في الرابط.</div>;
  }

  return (
    <div className="p-4">
      <ProjectMapsDistributionForm projectId={projectId} />
    </div>
  );
};

export default ProjectMapsPayrollPage;
