import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { OrdersWithVendors } from "../../../types/extended.type";

export function useOrders(projectId: string) {
  const [orders, setOrders] = useState<OrdersWithVendors[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: ordersError } = await supabase
        .from("shop_orders")
        .select("*, vendors(id, vendor_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching shop orders:", ordersError);
        setError(ordersError);
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error("Unexpected error fetching shop orders:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
