import { useCallback, useEffect, useState } from "react";
import {
  createRound,
  listRoundsForApplicant,
  updateRoundStatus,
} from "../../services/hr/interviewRoundsService";
import type { InterviewRound, InterviewRoundStatus } from "../../types/hr.type";
import type { InterviewRoundFormValues } from "../../types/schema/interviewRound.schema";

export function useInterviewRounds(applicantId: string | undefined) {
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!applicantId) return;
    setLoading(true);
    const { data, error } = await listRoundsForApplicant(applicantId);
    if (error) {
      console.error("Error fetching interview rounds:", error);
      setError("فشل في تحميل جولات المقابلة");
    } else {
      setError(null);
      setRounds(data ?? []);
    }
    setLoading(false);
  }, [applicantId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addRound = useCallback(
    async (values: InterviewRoundFormValues) => {
      if (!applicantId) return { success: false, message: "لا يوجد متقدم" };
      const nextRoundNumber =
        rounds.reduce((max, r) => Math.max(max, r.round_number), 0) + 1;
      const { data, error } = await createRound(
        applicantId,
        nextRoundNumber,
        values,
      );
      if (error || !data) {
        console.error("Error creating interview round:", error);
        return { success: false, message: "فشل في إضافة جولة المقابلة" };
      }
      setRounds((prev) => [...prev, data]);
      return { success: true };
    },
    [applicantId, rounds],
  );

  const setStatus = useCallback(
    async (id: string, status: InterviewRoundStatus) => {
      const { error } = await updateRoundStatus(id, status);
      if (error) {
        console.error("Error updating round status:", error);
        return { success: false };
      }
      setRounds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      return { success: true };
    },
    [],
  );

  return { rounds, loading, error, addRound, setStatus, refetch };
}
