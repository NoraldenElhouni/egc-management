import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { getJobRequest } from "../../services/hr/jobRequestsService";
import type { JobRequest } from "../../types/hr.type";

export function useJobRequest(id: string | undefined) {
  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getJobRequest(id);
    if (error) {
      console.error("Error fetching job request:", error);
      setError(error);
      setJobRequest(null);
    } else {
      setError(null);
      setJobRequest(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { jobRequest, loading, error, refetch };
}
