import { useParams } from "react-router-dom";
import EditProjectForm from "../../../components/website/EditProjectForm";

const WebsiteEditProjectPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <EditProjectForm projectId={id} />
    </div>
  );
};

export default WebsiteEditProjectPage;
