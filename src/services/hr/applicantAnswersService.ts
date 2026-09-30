import { supabase } from "../../lib/supabaseClient";
import type { ApplicantAnswerWithQuestion } from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

export const getAnswersForApplicant = async (applicantId: string) => {
  const { data, error } = await hrDb()
    .from("applicant_answers")
    .select("*, job_request_questions(*, job_request_question_options(*))")
    .eq("applicant_id", applicantId);

  return {
    data: (data ?? []) as ApplicantAnswerWithQuestion[],
    error,
  };
};

export interface AnswerInput {
  jobRequestQuestionId: string;
  answerText?: string | null;
  selectedOptionIds?: string[] | null;
}

export const submitAnswers = async (
  applicantId: string,
  answers: AnswerInput[],
) => {
  if (answers.length === 0) return { success: true };

  const { error } = await hrDb()
    .from("applicant_answers")
    .upsert(
      answers.map((a) => ({
        applicant_id: applicantId,
        job_request_question_id: a.jobRequestQuestionId,
        answer_text: a.answerText ?? null,
        selected_option_ids: a.selectedOptionIds ?? null,
      })),
      { onConflict: "applicant_id,job_request_question_id" },
    );

  if (error) {
    console.error("Error submitting applicant answers:", error);
    return { success: false, error, message: "فشل في حفظ إجابات الاستبيان" };
  }

  return { success: true };
};

/** Manual score for text / textarea / number answers (the DB trigger leaves it alone). */
export const setAnswerScore = async (id: string, score: number | null) => {
  return hrDb().from("applicant_answers").update({ score }).eq("id", id);
};
