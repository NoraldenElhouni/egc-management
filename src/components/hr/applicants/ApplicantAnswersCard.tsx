import { useState } from "react";
import type { ApplicantAnswerWithQuestion } from "../../../types/hr.type";

interface ApplicantAnswersCardProps {
  answers: ApplicantAnswerWithQuestion[];
  /** When set, unscored free-form answers get an inline score input. */
  onScore?: (answerId: string, score: number | null) => Promise<void> | void;
}

const MANUAL_SCORE_TYPES = ["text", "textarea", "number"];

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
    return ["yes", "true", "نعم"].includes((answer.answer_text ?? "").toLowerCase())
      ? "نعم"
      : "لا";
  }

  return answer.answer_text ?? "—";
};

const ManualScoreInput = ({
  answer,
  onScore,
}: {
  answer: ApplicantAnswerWithQuestion;
  onScore: NonNullable<ApplicantAnswersCardProps["onScore"]>;
}) => {
  const [value, setValue] = useState(answer.score?.toString() ?? "");

  const save = () => {
    const next = value.trim() === "" ? null : Number(value);
    if (next !== null && Number.isNaN(next)) return;
    if (next === answer.score) return;
    onScore(answer.id, next);
  };

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      placeholder="الدرجة"
      className="w-20 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
    />
  );
};

const ScoreLabel = ({ answer }: { answer: ApplicantAnswerWithQuestion }) => {
  if (answer.score === null) {
    return <span className="text-xs text-gray-400">لم يُقيّم</span>;
  }
  const weight = answer.job_request_questions?.weight ?? 1;
  return (
    <span className="text-xs text-gray-500">
      الدرجة: <span className="font-semibold text-gray-800">{answer.score}</span>
      {weight !== 1 && <> × {weight} = {answer.score * weight}</>}
    </span>
  );
};

const ApplicantAnswersCard: React.FC<ApplicantAnswersCardProps> = ({
  answers,
  onScore,
}) => {
  if (answers.length === 0) {
    return <p className="text-sm text-gray-500">لا توجد إجابات استبيان.</p>;
  }

  return (
    <ul className="space-y-3">
      {answers.map((answer) => {
        const manual = MANUAL_SCORE_TYPES.includes(
          answer.job_request_questions?.question_type ?? "",
        );
        return (
          <li key={answer.id} className="border-b last:border-b-0 pb-2">
            <div className="text-sm text-gray-500">
              {answer.job_request_questions?.question_text ?? "—"}
            </div>
            <div className="flex items-center justify-between gap-3 mt-0.5">
              <div className="text-sm text-gray-900 font-medium">
                {resolveDisplayValue(answer)}
              </div>
              {manual && onScore ? (
                <ManualScoreInput answer={answer} onScore={onScore} />
              ) : (
                <ScoreLabel answer={answer} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ApplicantAnswersCard;
