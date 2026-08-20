import { useParams } from "react-router-dom";
import { useSpecializations } from "../../../../../hooks/operations/contracts/useContracts";
import NewRoundForm from "../../../../../components/operations/contracts/round/NewRoundForm";

const NewRoundPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { specializations, loading: specLoading } = useSpecializations();

  return (
    <div className="p-4">
      <NewRoundForm
        projectId={projectId ?? ""}
        specializations={specializations}
        specLoading={specLoading}
      />
    </div>
  );
};

export default NewRoundPage;
