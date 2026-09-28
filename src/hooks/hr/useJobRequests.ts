import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  listJobRequests,
  listOpenJobRequests,
} from "../../services/hr/jobRequestsService";
import type { JobRequest } from "../../types/hr.type";

export function useJobRequests(openOnly = false) {
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = openOnly
      ? await listOpenJobRequests()
      : await listJobRequests();
    if (error) {
      console.error("Error fetching job requests:", error);
      setError(error);
    } else {
      setError(null);
      setJobRequests(data ?? []);
    }
    setLoading(false);
  }, [openOnly]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { jobRequests, loading, error, refetch };
}
