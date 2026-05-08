import { useEffect, useMemo, useState } from "react";
import { WorkRequests } from "../../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../../lib/supabaseClient";
import { RequestBids, RequestPage } from "../../../../types/contracts.type";

export function useWorkRequests(projectId: string) {
  const [workRequests, setWorkRequests] = useState<WorkRequests[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchWorkRequests() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("work_requests")
          .select("*")
          .eq("project_id", projectId);

        if (error) {
          console.error("error fetching work requests", error);
          setError(error);
        } else {
          setWorkRequests(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching work requests", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchWorkRequests();
  }, [projectId]); // ✅ re-runs when projectId changes

  return { workRequests, loading, error };
}

export function useWorkRequest(requestId: string) {
  const [workRequest, setWorkRequest] = useState<RequestPage | null>(null);
  const [bids, setBids] = useState<RequestBids[] | null>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const lowestBid = useMemo(
    () =>
      bids && bids.length > 0
        ? Math.min(...bids.map((b) => b.total_price))
        : null,
    [bids],
  );

  const highestBid = useMemo(
    () =>
      bids && bids.length > 0
        ? Math.max(...bids.map((b) => b.total_price))
        : null,
    [bids],
  );

  useEffect(() => {
    async function fetchWorkRequests() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("work_requests")
          .select(
            "*, projects(name), work_request_items(*), contractor_bids(count), specializations(name)",
          )
          .eq("id", requestId)
          .single();

        if (error) {
          console.error("error fetching work requests", error);
          setError(error);
        } else {
          setWorkRequest({
            ...data,
            bids_count:
              (data.contractor_bids as { count: number }[])[0]?.count ?? 0,
          });
        }

        const { data: bidsData, error: bidError } = await supabase
          .from("contractor_bids")
          .select("*, contractors(first_name, last_name)")
          .eq("request_id", requestId);

        if (bidError) {
          console.error("error fetching bids", bidError);
          setError(bidError);
        } else {
          setBids(bidsData);
        }
      } catch (err) {
        console.error("unexpected error fetching work requests", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }

    fetchWorkRequests();
  }, [requestId]);

  return { workRequest, bids, lowestBid, highestBid, loading, error };
}
