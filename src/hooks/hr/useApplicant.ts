import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { getApplicant } from "../../services/hr/applicantsService";
import type { Applicant } from "../../types/hr.type";

export function useApplicant(id: string | undefined) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getApplicant(id);
    if (error) {
      console.error("Error fetching applicant:", error);
      setError(error);
      setApplicant(null);
    } else {
      setError(null);
      setApplicant(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { applicant, loading, error, refetch };
}
