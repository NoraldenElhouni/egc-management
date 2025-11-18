import { useParams } from "react-router-dom";
import ProjectBookDetails from "../../../components/finance/bookkeeper/projects/ProjectBookDetails";
import { useProject } from "../../../hooks/useProjects";

const ProjectBookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Project ID is missing</div>;
  }

  const { project, loading, error } = useProject(id);
  return (
    <div>
      <ProjectBookDetails />
      {id}
      {project?.name}
    </div>
  );
};

export default ProjectBookDetailsPage;
