import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/** Lightweight count (no row data) of contractor payments + penalties awaiting review. */
export function usePendingContractorPaymentsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      setLoading(true);
      const [paymentsResult, penaltiesResult] = await Promise.all([
        supabase
          .schema("contracts")
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .schema("contracts")
          .from("payments_penalties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      if (cancelled) return;

      if (paymentsResult.error) console.error(paymentsResult.error);
      if (penaltiesResult.error) console.error(penaltiesResult.error);

      setCount((paymentsResult.count ?? 0) + (penaltiesResult.count ?? 0));
      setLoading(false);
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
