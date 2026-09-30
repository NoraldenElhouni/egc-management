import { useCallback, useEffect, useState } from "react";
import { getApplicantScore } from "../../services/hr/applicantScoresService";
import type { ApplicantScore } from "../../types/hr.type";

export function useApplicantScore(applicantId: string | undefined) {
  const [score, setScore] = useState<ApplicantScore | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!applicantId) return;
    setLoading(true);
    const { data, error } = await getApplicantScore(applicantId);
    if (error) {
      console.error("Error fetching applicant score:", error);
    } else {
      setScore(data);
    }
    setLoading(false);
  }, [applicantId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { score, loading, refetch };
}
