import { useParams } from "react-router-dom";
import TeamList from "../../../../components/project/lists/TeamList";

const ProjectTeamDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) {
    return <div>رقم المشروع غير موجود في الرابط.</div>;
  }
  return (
    <div>
      <div>form</div>
      <div>
        <TeamList projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectTeamDetailsPage;
