import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/** Lightweight count (no row data) of contractor payments awaiting review. */
export function usePendingContractorPaymentsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      setLoading(true);
      const { count: pendingCount, error } = await supabase
        .schema("contracts")
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (cancelled) return;

      if (error) console.error(error);

      setCount(pendingCount ?? 0);
      setLoading(false);
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
