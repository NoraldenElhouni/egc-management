import { useParams } from "react-router-dom";
import ProjectBookDetails from "../../../components/finance/bookkeeper/projects/ProjectBookDetails";

const ProjectBookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Project ID is missing</div>;
  }

  return (
    <div>
      <ProjectBookDetails id={id} />
    </div>
  );
};

export default ProjectBookDetailsPage;
