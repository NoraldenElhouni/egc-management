// hooks/operations/contracts/requests/useBidNegotiation.ts
import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../../../../lib/supabaseClient";

export interface NegotiationItem {
  id: string;
  request_item_id: string;
  original_price: number;
  proposed_price: number;
  quantity: number;
  total_price: number;
  work_request_items: {
    id: string;
    description: string | null;
    quantity: number;
    unit: string;
    services: { name: string };
  };
}

export interface BidForNegotiation {
  id: string;
  request_id: string;
  total_price: number;
  days_needed: number;
  notes: string | null;
  negotiation_round: number;
  final_total: number | null;
  final_days: number | null;
  contractors: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone_number: string | null;
  };
  work_requests: {
    id: string;
    title: string;
    projects: { name: string };
  };
  contractor_bid_items: {
    id: string;
    request_item_id: string;
    unit_price: number;
    quantity: number;
    unit: string;
    total_price: number;
    notes: string | null;
    work_request_items: {
      id: string;
      description: string | null;
      quantity: number;
      unit: string;
      services: { name: string };
    };
  }[];
  bid_negotiations: {
    id: string;
    round: number;
    proposed_total: number;
    proposed_days: number;
    note: string | null;
    status: "pending" | "accepted" | "rejected" | "expired" | "countered";
    initiated_role: "contractor" | "engineer";
    created_at: string;
  }[];
}

export function useBidForNegotiation(bidId: string) {
  const [bid, setBid] = useState<BidForNegotiation | null>(null);
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
            contractors(id, first_name, last_name, phone_number),
            work_requests(id, title, projects(name)),
            contractor_bid_items(
              *,
              work_request_items(id, description, quantity, unit, services(name))
            ),
            bid_negotiations(*)`,
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
