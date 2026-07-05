import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export interface OrderDetails {
  id: string;
  status: string;
  note: string | null;
  total_price: number | null;
  vendor_ref: string | null;
  created_at: string;
  quoted_at: string | null;
  approved_at: string | null;
  arrived_at: string | null;
  cancelled_at: string | null;
  rejected_at: string | null;
  project: { id: string; name: string; code: string } | null;
  created_by_user: { first_name: string; last_name: string | null } | null;
  approved_by_user: { first_name: string; last_name: string | null } | null;
  vendor: { id: string; vendor_name: string } | null;
  items: {
    id: string;
    name: string | null;
    quantity: number;
    quoted_unit_price: number | null;
    quoted_total: number | null;
    notes: string | null;
  }[];
}

export function useOrderDetails(orderId: string | undefined) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: orderError } = await supabase
        .from("shop_orders")
        .select(
          `
          id, status, note, total_price, vendor_ref, created_at,
          quoted_at, approved_at, arrived_at, cancelled_at, rejected_at,
          project:projects ( id, name, code ),
          created_by_user:users!shop_orders_created_by_fkey ( first_name, last_name ),
          approved_by_user:users!shop_orders_approved_by_fkey ( first_name, last_name ),
          vendor:vendors ( id, vendor_name ),
          items:shop_order_items ( id, name, quantity, quoted_unit_price, quoted_total, notes )
        `,
        )
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      setOrder(data as unknown as OrderDetails);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err as PostgrestError | Error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}
