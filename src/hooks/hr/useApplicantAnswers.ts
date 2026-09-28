import { useCallback, useEffect, useState } from "react";
import { getAnswersForApplicant } from "../../services/hr/applicantAnswersService";
import type { ApplicantAnswerWithQuestion } from "../../types/hr.type";

export function useApplicantAnswers(applicantId: string | undefined) {
  const [answers, setAnswers] = useState<ApplicantAnswerWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!applicantId) return;
    setLoading(true);
    const { data, error } = await getAnswersForApplicant(applicantId);
    if (error) {
      console.error("Error fetching applicant answers:", error);
      setError("فشل في تحميل إجابات الاستبيان");
    } else {
      setError(null);
      setAnswers(data);
    }
    setLoading(false);
  }, [applicantId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { answers, loading, error, refetch };
}
