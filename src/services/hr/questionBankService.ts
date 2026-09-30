import { supabase } from "../../lib/supabaseClient";
import type { Json } from "../../lib/supabase";
import type { QuestionType } from "../../types/hr.type";

const hrDb = () => supabase.schema("hr");

export const listQuestionBank = async () => {
  return hrDb()
    .from("question_bank")
    .select("*, question_bank_options(*)")
    .order("sort_order", { ascending: true });
};

export interface CreateBankQuestionInput {
  department: string | null;
  questionText: string;
  questionType: QuestionType;
  isRequiredDefault: boolean;
  config?: Json;
  weight?: number;
  options?: { text: string; score: number }[];
}

export const createBankQuestion = async (input: CreateBankQuestionInput) => {
  const { data: rows } = await hrDb()
    .from("question_bank")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (rows?.[0]?.sort_order ?? 0) + 1;

  const { data: question, error } = await hrDb()
    .from("question_bank")
    .insert({
      department: input.department,
      question_text: input.questionText.trim(),
      question_type: input.questionType,
      is_required_default: input.isRequiredDefault,
      config: input.config ?? {},
      weight: input.weight ?? 1,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error || !question) {
    console.error("Error creating bank question:", error);
    return { success: false, error, message: "فشل في إضافة السؤال" };
  }

  if (input.options && input.options.length > 0) {
    const { error: optionsError } = await hrDb()
      .from("question_bank_options")
      .insert(
        input.options.map((o, index) => ({
          bank_question_id: question.id,
          option_text: o.text,
          score: o.score,
          sort_order: index,
        })),
      );
    if (optionsError) {
      console.error("Error adding bank question options:", optionsError);
      return {
        success: false,
        error: optionsError,
        message: "فشل في إضافة خيارات السؤال",
      };
    }
  }

  return { success: true, data: question, message: "تمت إضافة السؤال بنجاح" };
};

export const updateBankQuestion = async (
  id: string,
  fields: {
    question_text?: string;
    is_required_default?: boolean;
    weight?: number;
    config?: Json;
  },
) => {
  return hrDb().from("question_bank").update(fields).eq("id", id);
};

export const setBankQuestionActive = async (id: string, isActive: boolean) => {
  return hrDb()
    .from("question_bank")
    .update({ is_active: isActive })
    .eq("id", id);
};

export const reorderBankQuestions = async (
  rows: { id: string; sort_order: number }[],
) => {
  return hrDb()
    .from("question_bank")
    .upsert(
      rows.map((r) => ({ id: r.id, sort_order: r.sort_order })),
      { onConflict: "id" },
    );
};

// ── options ──────────────────────────────────────────────────────────

export const addBankOption = async (
  bankQuestionId: string,
  optionText: string,
  sortOrder: number,
  score = 0,
) => {
  return hrDb()
    .from("question_bank_options")
    .insert({
      bank_question_id: bankQuestionId,
      option_text: optionText.trim(),
      score,
      sort_order: sortOrder,
    })
    .select()
    .single();
};

export const updateBankOption = async (
  id: string,
  optionText: string,
  score: number,
) => {
  return hrDb()
    .from("question_bank_options")
    .update({ option_text: optionText.trim(), score })
    .eq("id", id);
};

export const deleteBankOption = async (id: string) => {
  return hrDb().from("question_bank_options").delete().eq("id", id);
};
