import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/** Lightweight count (no row data) of purchase orders awaiting review. */
export function usePendingOrdersCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      setLoading(true);
      const { count: ordersCount, error } = await supabase
        .from("shop_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "arrived"])
        .eq("finance_entered", false);
      if (cancelled) return;

      if (error) console.error(error);

      setCount(ordersCount ?? 0);
      setLoading(false);
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
