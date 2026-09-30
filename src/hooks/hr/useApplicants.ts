import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { listApplicants } from "../../services/hr/applicantsService";
import { listApplicantScores } from "../../services/hr/applicantScoresService";
import type { Applicant } from "../../types/hr.type";

/** An applicant row plus its DB-computed total score (null = no score row). */
export type ApplicantWithScore = Applicant & { total_score: number | null };

export function useApplicants() {
  const [applicants, setApplicants] = useState<ApplicantWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, scoresResult] = await Promise.all([
      listApplicants(),
      listApplicantScores(),
    ]);
    if (error) {
      console.error("Error fetching applicants:", error);
      setError(error);
    } else {
      setError(null);
      // A failed scores read must not hide the applicants themselves.
      if (scoresResult.error) {
        console.error("Error fetching applicant scores:", scoresResult.error);
      }
      const totals = new Map(
        (scoresResult.data ?? []).map((s) => [s.applicant_id, s.total_score]),
      );
      setApplicants(
        (data ?? []).map((a) => ({ ...a, total_score: totals.get(a.id) ?? null })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { applicants, loading, error, refetch };
}
