import { useCallback, useEffect, useState } from "react";
import {
  listReviewsForEmployee,
  submitPerformanceReview,
  type SubmitPerformanceReviewInput,
} from "../../services/hr/performanceReviewService";
import type { PerformanceReviewWithRatings } from "../../types/hr.type";

export function usePerformanceReviews(employeeId: string | undefined) {
  const [reviews, setReviews] = useState<PerformanceReviewWithRatings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const { data, error } = await listReviewsForEmployee(employeeId);
    if (error) {
      console.error("Error fetching performance reviews:", error);
      setError("فشل في تحميل تقييمات الأداء");
    } else {
      setError(null);
      setReviews(data);
    }
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const submit = useCallback(
    async (input: SubmitPerformanceReviewInput) => {
      const result = await submitPerformanceReview(input);
      if (result.success) await refetch();
      return result;
    },
    [refetch],
  );

  return { reviews, loading, error, submit, refetch };
}
