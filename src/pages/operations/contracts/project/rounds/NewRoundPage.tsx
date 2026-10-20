import { useParams } from "react-router-dom";
import NewRoundForm from "../../../../../components/operations/contracts/round/NewRoundForm";

const NewRoundPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="p-4">
      <NewRoundForm
        projectId={projectId ?? ""}
      />
    </div>
  );
};

export default NewRoundPage;
