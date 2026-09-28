import type { ApplicantAnswerWithQuestion } from "../../../types/hr.type";

interface ApplicantAnswersCardProps {
  answers: ApplicantAnswerWithQuestion[];
}

const resolveDisplayValue = (answer: ApplicantAnswerWithQuestion): string => {
  const question = answer.job_request_questions;
  if (!question) return "—";

  if (answer.selected_option_ids && answer.selected_option_ids.length > 0) {
    const optionsById = new Map(
      question.job_request_question_options.map((o) => [o.id, o.option_text]),
    );
    return answer.selected_option_ids
      .map((id) => optionsById.get(id) ?? "—")
      .join("، ");
  }

  if (question.question_type === "yes_no") {
    return answer.answer_text === "yes" ? "نعم" : "لا";
  }

  return answer.answer_text ?? "—";
};

const ApplicantAnswersCard: React.FC<ApplicantAnswersCardProps> = ({
  answers,
}) => {
  if (answers.length === 0) {
    return <p className="text-sm text-gray-500">لا توجد إجابات استبيان.</p>;
  }

  return (
    <ul className="space-y-3">
      {answers.map((answer) => (
        <li key={answer.id} className="border-b last:border-b-0 pb-2">
          <div className="text-sm text-gray-500">
            {answer.job_request_questions?.question_text ?? "—"}
          </div>
          <div className="text-sm text-gray-900 font-medium mt-0.5">
            {resolveDisplayValue(answer)}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ApplicantAnswersCard;
