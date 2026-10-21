import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { agreementsDb } from "../../../lib/agreementsDb";

/**
 * Lightweight count (no row data) of what awaits review in the contractor
 * payments queue: payments, plus penalties waiting for approval.
 */
export function usePendingContractorPaymentsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      setLoading(true);
      const [payments, penalties] = await Promise.all([
        supabase
          .schema("contracts")
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        agreementsDb
          .schema("contracts")
          .from("penalties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      if (cancelled) return;

      if (payments.error) console.error(payments.error);
      if (penalties.error) console.error(penalties.error);

      setCount((payments.count ?? 0) + (penalties.count ?? 0));
      setLoading(false);
    }

    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
