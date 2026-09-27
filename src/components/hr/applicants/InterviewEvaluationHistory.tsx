import type {
  EvaluationCriteria,
  InterviewEvaluationWithRatings,
  InterviewRound,
  RatingScale,
} from "../../../types/hr.type";
import { recommendationLabel } from "../../../types/hr.type";

interface InterviewEvaluationHistoryProps {
  evaluations: InterviewEvaluationWithRatings[];
  criteria: EvaluationCriteria[];
  ratingScale: RatingScale[];
  rounds: InterviewRound[];
}

const RECOMMENDATION_VARIANT: Record<string, string> = {
  accepted: "text-green-700 bg-green-50 border-green-200",
  waitlisted: "text-amber-700 bg-amber-50 border-amber-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
};

const InterviewEvaluationHistory: React.FC<InterviewEvaluationHistoryProps> = ({
  evaluations,
  criteria,
  ratingScale,
  rounds,
}) => {
  if (evaluations.length === 0) {
    return <p className="text-sm text-gray-500">لا توجد تقييمات مقابلة بعد.</p>;
  }

  const criteriaById = new Map(criteria.map((c) => [c.id, c]));
  const ratingById = new Map(ratingScale.map((r) => [r.id, r]));
  const roundById = new Map(rounds.map((r) => [r.id, r]));

  return (
    <div className="space-y-3">
      {evaluations.map((evaluation) => (
        <div key={evaluation.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">
              {new Date(evaluation.evaluated_at).toLocaleString("ar-LY")}
              {evaluation.interview_round_id &&
                roundById.get(evaluation.interview_round_id) && (
                  <span>
                    {" "}
                    — جولة{" "}
                    {roundById.get(evaluation.interview_round_id)?.round_number}
                  </span>
                )}
              {evaluation.evaluator_name && (
                <span> — بواسطة {evaluation.evaluator_name}</span>
              )}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                RECOMMENDATION_VARIANT[evaluation.recommendation ?? ""] ??
                "text-gray-700 bg-gray-50 border-gray-200"
              }`}
            >
              {recommendationLabel(evaluation.recommendation)}
            </span>
          </div>

          <ul className="text-sm text-gray-700 space-y-1">
            {evaluation.interview_evaluation_ratings.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>{criteriaById.get(r.criteria_id)?.name_ar ?? "—"}</span>
                <span className="font-medium">
                  {ratingById.get(r.rating_id)?.label_ar ?? "—"}
                </span>
              </li>
            ))}
          </ul>

          {evaluation.additional_notes && (
            <p className="text-sm text-gray-600 mt-2 pt-2 border-t whitespace-pre-wrap">
              {evaluation.additional_notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default InterviewEvaluationHistory;
