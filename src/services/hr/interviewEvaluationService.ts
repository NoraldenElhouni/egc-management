import { supabase } from "../../lib/supabaseClient";
import { resolveEmployeeNames } from "./resolveEmployeeNames";
import type {
  InterviewEvaluationWithRatings,
  Recommendation,
} from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

export const listEvaluationsForApplicant = async (applicantId: string) => {
  const { data, error } = await hrDb()
    .from("interview_evaluations")
    .select("*, interview_evaluation_ratings(*)")
    .eq("applicant_id", applicantId)
    .order("evaluated_at", { ascending: false });

  if (error || !data) {
    return { data: [] as InterviewEvaluationWithRatings[], error };
  }

  const namesById = await resolveEmployeeNames(
    data.map((e) => e.evaluator_employee_id),
  );

  return {
    data: data.map((e) => ({
      ...e,
      evaluator_name: e.evaluator_employee_id
        ? (namesById.get(e.evaluator_employee_id) ?? null)
        : null,
    })) as InterviewEvaluationWithRatings[],
    error: null,
  };
};

export interface SubmitInterviewEvaluationInput {
  applicantId: string;
  interviewRoundId?: string | null;
  evaluatorEmployeeId: string | null;
  recommendation: Recommendation;
  additionalNotes?: string;
  ratings: { criteriaId: string; ratingId: string; notes?: string }[];
}

export const submitInterviewEvaluation = async (
  input: SubmitInterviewEvaluationInput,
) => {
  const { data: evaluation, error: evaluationError } = await hrDb()
    .from("interview_evaluations")
    .insert({
      applicant_id: input.applicantId,
      interview_round_id: input.interviewRoundId || null,
      evaluator_employee_id: input.evaluatorEmployeeId,
      recommendation: input.recommendation,
      additional_notes: input.additionalNotes?.trim() || null,
    })
    .select()
    .single();

  if (evaluationError || !evaluation) {
    console.error("Error creating interview evaluation:", evaluationError);
    return {
      success: false,
      error: evaluationError,
      message: "فشل في حفظ تقييم المقابلة",
    };
  }

  const ratingsPayload = input.ratings.map((r) => ({
    evaluation_id: evaluation.id,
    criteria_id: r.criteriaId,
    rating_id: r.ratingId,
    committee_notes: r.notes?.trim() || null,
  }));

  const { error: ratingsError } = await hrDb()
    .from("interview_evaluation_ratings")
    .insert(ratingsPayload);

  if (ratingsError) {
    console.error("Error saving evaluation ratings:", ratingsError);
    return {
      success: false,
      error: ratingsError,
      message: "فشل في حفظ درجات التقييم",
    };
  }

  return {
    success: true,
    data: evaluation,
    message: "تم حفظ تقييم المقابلة بنجاح",
  };
};
