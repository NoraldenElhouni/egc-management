import { supabase } from "../../lib/supabaseClient";
import type { InterviewRoundStatus } from "../../types/hr.type";
import type { InterviewRoundFormValues } from "../../types/schema/interviewRound.schema";

const hrDb = () => supabase.schema("hr");

export const listRoundsForApplicant = async (applicantId: string) => {
  return hrDb()
    .from("interview_rounds")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("round_number", { ascending: true });
};

export const createRound = async (
  applicantId: string,
  nextRoundNumber: number,
  data: InterviewRoundFormValues,
) => {
  const normalize = (v?: string | null) => {
    if (v === undefined || v === null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  };

  return hrDb()
    .from("interview_rounds")
    .insert({
      applicant_id: applicantId,
      round_number: nextRoundNumber,
      interview_type: data.interviewType ?? null,
      scheduled_at: data.scheduledAt
        ? new Date(data.scheduledAt).toISOString()
        : null,
      interviewer_employee_id: normalize(data.interviewerEmployeeId),
      location: normalize(data.location),
    })
    .select()
    .single();
};

export const updateRoundStatus = async (
  id: string,
  status: InterviewRoundStatus,
) => {
  return hrDb().from("interview_rounds").update({ status }).eq("id", id);
};
