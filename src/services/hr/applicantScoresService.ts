import { supabase } from "../../lib/supabaseClient";

const hrDb = () => supabase.schema("hr");

/** Reads the `hr.applicant_scores` view — totals are computed in the DB. */
export const listApplicantScores = async () => {
  return hrDb().from("applicant_scores").select("*");
};

export const getApplicantScore = async (applicantId: string) => {
  return hrDb()
    .from("applicant_scores")
    .select("*")
    .eq("applicant_id", applicantId)
    .maybeSingle();
};
