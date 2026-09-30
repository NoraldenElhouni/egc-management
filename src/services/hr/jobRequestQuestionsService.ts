import { supabase } from "../../lib/supabaseClient";
import type { Json } from "../../lib/supabase";
import type { JobRequestQuestionWithOptions, QuestionType } from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

export const listQuestionsForJobRequest = async (jobRequestId: string) => {
  const { data, error } = await hrDb()
    .from("job_request_questions")
    .select("*, job_request_question_options(*)")
    .eq("job_request_id", jobRequestId)
    .order("sort_order", { ascending: true });

  return {
    data: (data ?? []) as JobRequestQuestionWithOptions[],
    error,
  };
};

/** Copies a bank question (and its options) into a job request via the DB helper function. */
export const copyBankQuestionToJobRequest = async (
  jobRequestId: string,
  bankQuestionId: string,
) => {
  return hrDb().rpc("copy_bank_question_to_job_request", {
    p_job_request_id: jobRequestId,
    p_bank_question_id: bankQuestionId,
  });
};

export interface AddFreeformQuestionInput {
  jobRequestId: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  config?: Json;
  weight?: number;
  options?: { text: string; score: number }[];
}

export const addFreeformQuestion = async (input: AddFreeformQuestionInput) => {
  const { data: rows } = await hrDb()
    .from("job_request_questions")
    .select("sort_order")
    .eq("job_request_id", input.jobRequestId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (rows?.[0]?.sort_order ?? 0) + 1;

  const { data: question, error } = await hrDb()
    .from("job_request_questions")
    .insert({
      job_request_id: input.jobRequestId,
      question_text: input.questionText.trim(),
      question_type: input.questionType,
      is_required: input.isRequired,
      config: input.config ?? {},
      weight: input.weight ?? 1,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error || !question) {
    console.error("Error adding job request question:", error);
    return { success: false, error, message: "فشل في إضافة السؤال" };
  }

  if (input.options && input.options.length > 0) {
    const { error: optionsError } = await hrDb()
      .from("job_request_question_options")
      .insert(
        input.options.map((o, index) => ({
          job_request_question_id: question.id,
          option_text: o.text,
          score: o.score,
          sort_order: index,
        })),
      );
    if (optionsError) {
      console.error("Error adding job request question options:", optionsError);
      return {
        success: false,
        error: optionsError,
        message: "فشل في إضافة خيارات السؤال",
      };
    }
  }

  return { success: true, data: question, message: "تمت إضافة السؤال بنجاح" };
};

export const updateJobRequestQuestion = async (
  id: string,
  fields: {
    question_text?: string;
    is_required?: boolean;
    weight?: number;
    config?: Json;
  },
) => {
  return hrDb().from("job_request_questions").update(fields).eq("id", id);
};

export const deleteJobRequestQuestion = async (id: string) => {
  return hrDb().from("job_request_questions").delete().eq("id", id);
};

export const reorderJobRequestQuestions = async (
  rows: { id: string; sort_order: number }[],
) => {
  return hrDb()
    .from("job_request_questions")
    .upsert(
      rows.map((r) => ({ id: r.id, sort_order: r.sort_order })),
      { onConflict: "id" },
    );
};

// ── options (for a freeform or already-copied job-request question) ───

export const addJobRequestQuestionOption = async (
  jobRequestQuestionId: string,
  optionText: string,
  sortOrder: number,
  score = 0,
) => {
  return hrDb()
    .from("job_request_question_options")
    .insert({
      job_request_question_id: jobRequestQuestionId,
      option_text: optionText.trim(),
      score,
      sort_order: sortOrder,
    })
    .select()
    .single();
};

export const updateJobRequestQuestionOption = async (
  id: string,
  optionText: string,
  score: number,
) => {
  return hrDb()
    .from("job_request_question_options")
    .update({ option_text: optionText.trim(), score })
    .eq("id", id);
};

export const deleteJobRequestQuestionOption = async (id: string) => {
  return hrDb().from("job_request_question_options").delete().eq("id", id);
};
