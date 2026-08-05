import { Navigate, useParams } from "react-router-dom";

const OperationsBOQProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return <Navigate to={`/operations/boq/project/${projectId}/types`} replace />;
};

export default OperationsBOQProjectPage;
