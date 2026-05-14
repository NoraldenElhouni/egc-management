import { useEffect, useMemo, useState } from "react";
import { Attachments, WorkRequests } from "../../../../types/global.type";
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

export function useBidsByRequest(requestId: string) {
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

export interface WorkRequestItem {
  id: string;
  request_id: string;
  quantity: number;
  unit: string;
  description: string | null;
  created_at: string;
  services: {
    id: string;
    name: string;
  };
}

export interface WorkRequestDetail {
  id: string;
  title: string;
  description: string | null;
  mode: "open" | "direct";
  status: string;
  bid_deadline: string | null;
  work_start_at: string | null;
  created_at: string;
  bids_count: number;
  projects: { name: string };
  specializations: { name: string };
  work_request_items: WorkRequestItem[];
  employees: {
    first_name: string;
    last_name: string | null;
  };
  contractors: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone_number: string | null;
  } | null; // null when mode is "open"
  attachments: Attachments[];
}

export function useWorkRequest(requestId: string) {
  const [workRequest, setWorkRequest] = useState<WorkRequestDetail | null>(
    null,
  );
  const [bids, setBids] = useState<RequestBids[] | null>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!requestId) return;

    async function fetch() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("work_requests")
          .select(
            `*,
            projects(name),
            specializations(name),
            contractor_bids(count),
            work_request_items(*, services(id, name)),
            employees!work_requests_created_by_fkey(first_name, last_name),
            contractors!work_requests_direct_contractor_fkey(id, first_name, last_name, phone_number)`,
          )
          .eq("id", requestId)
          .single();

        if (error) {
          setError(error);
        } else {
          const { data: attachmentsData } = await supabase
            .from("attachments")
            .select("*")
            .eq("entity_type", "work_request")
            .eq("entity_id", requestId);

          setWorkRequest({
            ...data,
            attachments: attachmentsData ?? [],
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
        setError(err as PostgrestError);
      }
      setLoading(false);
    }

    fetch();
  }, [requestId]);

  return { workRequest, loading, error, bids };
}

export interface BidItem {
  id: string;
  bid_id: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total_price: number;
  notes: string | null;
  work_request_items: {
    description: string | null;
    services: {
      name: string;
    };
  };
}

export interface BidDetail {
  id: string;
  request_id: string;
  contractor_id: string;
  total_price: number;
  days_needed: number;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  submitted_at: string;
  reviewed_at: string | null;
  contractors: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone_number: string | null;
    email: string | null;
  };
  work_requests: {
    title: string;
    projects: {
      name: string;
    };
  };
  contractor_bid_items: BidItem[];
}

export function useBidDetail(bidId: string) {
  const [bid, setBid] = useState<BidDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!bidId) return;

    async function fetch() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contractor_bids")
          .select(
            `*,
            contractors(id, first_name, last_name, phone_number, email),
            work_requests(title, projects(name)),
            contractor_bid_items(
              *,
              work_request_items(description, services(name))
            )`,
          )
          .eq("id", bidId)
          .single();

        if (error) setError(error);
        else setBid(data);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }

    fetch();
  }, [bidId]);

  return { bid, loading, error };
}
