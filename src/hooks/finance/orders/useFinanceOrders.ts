import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { OrdersWithVendors } from "../../../types/extended.type";

export interface FinanceOrderRow extends OrdersWithVendors {
  projects: { id: string; name: string } | null;
  finance_entered: boolean;
  finance_entered_at: string | null;
  finance_entered_by: string | null;
}

export function useFinanceOrders() {
  const [orders, setOrders] = useState<FinanceOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: ordersError } = await supabase
        .from("shop_orders")
        .select("*, vendors(id, vendor_name), projects(id, name)")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching finance orders:", ordersError);
        setError(ordersError);
        return;
      }

      setOrders((data as FinanceOrderRow[]) || []);
    } catch (err) {
      console.error("Unexpected error fetching finance orders:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const markOrdersEntered = useCallback(
    async (orderIds: string[], userId?: string | null) => {
      if (orderIds.length === 0) return { error: null };

      const { error: updateError } = await supabase
        .from("shop_orders")
        .update({
          finance_entered: true,
          finance_entered_at: new Date().toISOString(),
          finance_entered_by: userId ?? null,
        })
        .in("id", orderIds);

      if (updateError) {
        console.error("Error marking orders as entered:", updateError);
        return { error: updateError };
      }

      await fetchOrders();
      return { error: null };
    },
    [fetchOrders],
  );

  return { orders, loading, error, refetch: fetchOrders, markOrdersEntered };
}
