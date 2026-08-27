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

// One order count per project, for the projects list page.
export function useOrderCountsByProject(enabled: boolean) {
  const [countsByProject, setCountsByProject] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!enabled) return;
    async function fetchCounts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("shop_orders")
          .select("project_id");

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        const counts = (data ?? []).reduce<Record<string, number>>(
          (acc, row) => {
            acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
            return acc;
          },
          {},
        );
        setCountsByProject(counts);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchCounts();
  }, [enabled]);

  return { countsByProject, loading, error };
}
