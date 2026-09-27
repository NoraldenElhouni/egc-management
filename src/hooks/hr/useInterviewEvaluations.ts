import { useCallback, useEffect, useState } from "react";
import {
  listEvaluationsForApplicant,
  submitInterviewEvaluation,
  type SubmitInterviewEvaluationInput,
} from "../../services/hr/interviewEvaluationService";
import type { InterviewEvaluationWithRatings } from "../../types/hr.type";

export function useInterviewEvaluations(applicantId: string | undefined) {
  const [evaluations, setEvaluations] = useState<
    InterviewEvaluationWithRatings[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!applicantId) return;
    setLoading(true);
    const { data, error } = await listEvaluationsForApplicant(applicantId);
    if (error) {
      console.error("Error fetching interview evaluations:", error);
      setError("فشل في تحميل تقييمات المقابلة");
    } else {
      setError(null);
      setEvaluations(data);
    }
    setLoading(false);
  }, [applicantId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const submit = useCallback(
    async (input: SubmitInterviewEvaluationInput) => {
      const result = await submitInterviewEvaluation(input);
      if (result.success) await refetch();
      return result;
    },
    [refetch],
  );

  return { evaluations, loading, error, submit, refetch };
}
