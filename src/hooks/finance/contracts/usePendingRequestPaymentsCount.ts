import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/** Lightweight count (no row data) of contract payment requests awaiting review. */
export function usePendingRequestPaymentsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      setLoading(true);
      const { count: requestPaymentsCount, error } = await supabase
        .schema("contracts")
        .from("request_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("finance_entered", false);

      if (cancelled) return;

      if (error) console.error(error);

      setCount(requestPaymentsCount ?? 0);
      setLoading(false);
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
