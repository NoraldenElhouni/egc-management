import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Json } from "../../../../lib/supabase";

export interface AwardMilestoneInput {
  title: string;
  description: string | null;
  percentage: number;
  due_date: string | null;
}

export interface AwardQuoteInput {
  quote_id: string;
  advance_percentage: number;
  insurance_percentage: number;
  delay_penalty_per_day: number | null;
  duration_days: number | null;
  start_date: string | null;
  terms: string | null;
  push_extras: boolean;
  milestones: AwardMilestoneInput[];
}

export function useAwardQuote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  async function awardQuote(input: AwardQuoteInput) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: rpcError } = await supabase
      .schema("contracts")
      .rpc("award_quote", {
        p_quote_id: input.quote_id,
        p_created_by: user?.id ?? "",
        p_advance: input.advance_percentage,
        p_insurance: input.insurance_percentage,
        p_delay_penalty: input.delay_penalty_per_day ?? undefined,
        p_days: input.duration_days ?? undefined,
        p_start: input.start_date ?? undefined,
        p_terms: input.terms ?? undefined,
        p_push_extras: input.push_extras,
        p_milestones: input.milestones as unknown as Json,
      });

    if (rpcError) {
      setError(rpcError);
      setLoading(false);
      return { error: rpcError };
    }

    setLoading(false);
    return { error: null, contractId: data as string };
  }

  return { awardQuote, loading, error };
}
