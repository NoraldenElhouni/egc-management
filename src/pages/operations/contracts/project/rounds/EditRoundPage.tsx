import { useNavigate, useParams } from "react-router-dom";
import { useSpecializations } from "../../../../../hooks/operations/contracts/useContracts";
import { useRound } from "../../../../../hooks/operations/contracts/rounds/useRounds";
import EditRoundForm from "../../../../../components/operations/contracts/round/EditRoundForm";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../components/ui/errorPage";
import Button from "../../../../../components/ui/Button";

const EditRoundPage = () => {
  const { projectId, roundId } = useParams<{
    projectId: string;
    roundId: string;
  }>();
  const { specializations, loading: specLoading } = useSpecializations();
  const { round, loading, error } = useRound(roundId ?? "");
  const navigate = useNavigate();

  if (!roundId || !projectId) return null;
  if (loading) return <LoadingPage label="جاري تحميل بيانات الجولة..." />;
  if (error)
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل الجولة"
        error={error.message}
      />
    );
  if (!round) return null;

  if (round.status !== "draft") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-gray-600 text-sm">
          لا يمكن تعديل هذه الجولة لأنها لم تعد في حالة المسودة.
        </p>
        <Button variant="primary-outline" onClick={() => navigate(-1)}>
          رجوع
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <EditRoundForm
        projectId={projectId}
        roundId={roundId}
        existingRound={round}
        specializations={specializations}
        specLoading={specLoading}
      />
    </div>
  );
};

export default EditRoundPage;
