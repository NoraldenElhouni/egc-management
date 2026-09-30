import { useParams } from "react-router-dom";
import ApplicantPersonalInfoCard from "../../components/hr/applicants/ApplicantPersonalInfoCard";
import ApplicantStatusControl from "../../components/hr/applicants/ApplicantStatusControl";
import HireApplicantButton from "../../components/hr/applicants/HireApplicantButton";
import InterviewRoundsSection from "../../components/hr/applicants/InterviewRoundsSection";
import InterviewEvaluationForm from "../../components/hr/applicants/InterviewEvaluationForm";
import InterviewEvaluationHistory from "../../components/hr/applicants/InterviewEvaluationHistory";
import ApplicantAnswersCard from "../../components/hr/applicants/ApplicantAnswersCard";
import ApplicantScoreCard from "../../components/hr/applicants/ApplicantScoreCard";
import { useApplicant } from "../../hooks/hr/useApplicant";
import { useInterviewRounds } from "../../hooks/hr/useInterviewRounds";
import { useInterviewEvaluations } from "../../hooks/hr/useInterviewEvaluations";
import { useEvaluationConfig } from "../../hooks/hr/useEvaluationConfig";
import { useApplicantAnswers } from "../../hooks/hr/useApplicantAnswers";
import { useApplicantScore } from "../../hooks/hr/useApplicantScore";
import { setAnswerScore } from "../../services/hr/applicantAnswersService";
import { useCan } from "../../hooks/permissions/useCan";

const ApplicantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const applicantId = id || "";

  const { applicant, loading, error, refetch } = useApplicant(applicantId);
  const roundsState = useInterviewRounds(applicantId);
  const { evaluations } = useInterviewEvaluations(applicantId);
  const { criteria, ratingScale } = useEvaluationConfig("interview");
  const { answers, refetch: refetchAnswers } = useApplicantAnswers(applicantId);
  const { score, refetch: refetchScore } = useApplicantScore(applicantId);
  const { can: canEvaluate } = useCan("evaluate_applicants");

  const handleScoreAnswer = async (answerId: string, value: number | null) => {
    const { error: scoreError } = await setAnswerScore(answerId, value);
    if (scoreError) {
      alert("فشل في حفظ الدرجة");
      return;
    }
    await Promise.all([refetchAnswers(), refetchScore()]);
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;
  if (error || !applicant)
    return <div className="p-6">خطأ في تحميل بيانات المتقدم.</div>;

  return (
    <div className="bg-background min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <ApplicantStatusControl
          applicantId={applicant.id}
          status={applicant.application_status}
          onUpdated={refetch}
        />
        <HireApplicantButton applicant={applicant} />
      </div>

      <ApplicantPersonalInfoCard applicant={applicant} onUpdated={refetch} />

      <ApplicantScoreCard score={score} />

      {answers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-md font-medium text-gray-800 mb-4">
            إجابات استبيان الوظيفة
          </h3>
          <ApplicantAnswersCard
            answers={answers}
            onScore={canEvaluate ? handleScoreAnswer : undefined}
          />
        </div>
      )}

      <InterviewRoundsSection
        rounds={roundsState.rounds}
        loading={roundsState.loading}
        addRound={roundsState.addRound}
        setStatus={roundsState.setStatus}
      />

      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="text-md font-medium text-gray-800 mb-4">
          تقييمات المقابلة السابقة
        </h3>
        <InterviewEvaluationHistory
          evaluations={evaluations}
          criteria={criteria}
          ratingScale={ratingScale}
          rounds={roundsState.rounds}
        />
      </div>

      {canEvaluate && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-md font-medium text-gray-800 mb-4">
            إضافة تقييم مقابلة
          </h3>
          <InterviewEvaluationForm
            applicantId={applicantId}
            rounds={roundsState.rounds}
          />
        </div>
      )}
    </div>
  );
};

export default ApplicantDetailsPage;
