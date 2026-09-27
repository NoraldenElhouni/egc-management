import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { listApplicants } from "../../services/hr/applicantsService";
import type { Applicant } from "../../types/hr.type";

export function useApplicants() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listApplicants();
    if (error) {
      console.error("Error fetching applicants:", error);
      setError(error);
    } else {
      setError(null);
      setApplicants(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { applicants, loading, error, refetch };
}
