import { useEffect, useMemo, useState } from "react";
import { Attachments, WorkRequests } from "../../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../../lib/supabaseClient";
import { RequestBids, RequestPage } from "../../../../types/contracts.type";
import { RequestForm } from "../../../../types/schema/contracts.schema";

// ── Shape of an existing request fetched from DB ──────────────────────────────
export type ExistingRequest = {
  id: string;
  specialization_id: string;
  title: string;
  description: string;
  bid_deadline: string;
  work_start_at: string;
  mode: "open" | "direct";
  direct_contractor_id: string | null;
  contact_name: string;
  contact_phone: string;
  delay_penalty_terms: string;
  retention_terms: string;
  contractor_provides_materials: boolean;
  work_request_items: {
    service_id: string;
    quantity: number;
    unit: string;
    services: { id: string; name: string; unit: string | null } | null;
  }[];
};

// ── Fetch a single request with its items ─────────────────────────────────────
export function useRequest(requestId: string) {
  const [request, setRequest] = useState<ExistingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_requests")
      .select(
        `
        id,
        specialization_id,
        title,
        description,
        bid_deadline,
        work_start_at,
        mode,
        direct_contractor_id,
        contact_name,
        contact_phone,
        delay_penalty_terms,
        retention_terms,
        contractor_provides_materials,
        work_request_items (
          service_id,
          quantity,
          unit,
          services ( id, name, unit )
        )
      `,
      )
      .eq("id", requestId)
      .single();

    if (error) setError(error);
    else setRequest(data as ExistingRequest);
    setLoading(false);
  };

  // Trigger on mount
  useState(() => {
    if (requestId) fetch();
  });

  return { request, loading, error, refetch: fetch };
}

// ── Update hook ───────────────────────────────────────────────────────────────
export function useEditRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function editRequest(values: RequestForm, requestId: string) {
    setLoading(true);
    setError(null);

    // Step 1: update the request header
    const { error: updateError } = await supabase
      .from("work_requests")
      .update({
        specialization_id: values.specialization_id,
        title: values.title,
        description: values.description,
        bid_deadline: values.bid_deadline,
        work_start_at: values.work_start_at,
        mode: values.bid_mode,
        contact_name: values.contact_name,
        contact_phone: values.contact_phone,
        delay_penalty_terms: values.delay_penalty_terms,
        retention_terms: values.retention_terms,
        contractor_provides_materials: values.contractor_provides_materials,
        direct_contractor_id:
          values.bid_mode === "direct" ? values.direct_contractor_id : null,
      })
      .eq("id", requestId);

    if (updateError) {
      setError(updateError);
      setLoading(false);
      return { error: updateError };
    }

    // Step 2: replace items (delete old → insert new)
    const { error: deleteError } = await supabase
      .from("work_request_items")
      .delete()
      .eq("request_id", requestId);

    if (deleteError) {
      setError(deleteError);
      setLoading(false);
      return { error: deleteError };
    }

    const { error: itemsError } = await supabase
      .from("work_request_items")
      .insert(
        values.items.map((item) => ({
          request_id: requestId,
          service_id: item.id,
          quantity: item.quantity,
          unit: item.unit,
        })),
      );

    if (itemsError) {
      setError(itemsError);
      setLoading(false);
      return { error: itemsError };
    }

    setLoading(false);
    return { error: null };
  }

  return { editRequest, loading, error };
}

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
          .select("*, contractors(id, first_name, last_name)")
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
  delay_penalty_terms: string | null;
  contractor_provides_materials: boolean;
  retention_terms: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  bids_count: number;
  projects: { name: string };
  specializations: { name: string };
  work_request_items: WorkRequestItem[];
  employees: {
    id: string;
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
            employees!work_requests_created_by_fkey(id, first_name, last_name),
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
          .select("*, contractors(id, first_name, last_name)")
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
