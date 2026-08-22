import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { fetchByIds } from "../crossSchemaLookup";
import { RoundItemRow } from "./useRounds";

export interface QuoteItemRow {
  id: string;
  quote_id: string;
  round_item_id: string | null;
  work_id: string | null;
  name: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  total_price: number | null;
  note: string | null;
}

interface ContractorNameRow {
  id: string;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
}

export interface QuoteRow {
  id: string;
  round_id: string;
  contractor_id: string;
  total: number;
  days_needed: number | null;
  notes: string | null;
  created_at: string;
  quote_items: QuoteItemRow[];
  contractor: ContractorNameRow | null;
}

export function useQuotesByRound(roundId: string) {
  const [round, setRound] = useState<{
    id: string;
    title: string;
    round_items: RoundItemRow[];
  } | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchQuotes = async () => {
    if (!roundId) return;
    setLoading(true);
    try {
      const { data: roundData, error: roundError } = await supabase
        .schema("contracts")
        .from("rounds")
        .select("id, title, round_items(*)")
        .eq("id", roundId)
        .single();

      if (roundError) {
        setError(roundError);
        setLoading(false);
        return;
      }
      setRound(roundData);

      const { data: quotesData, error: quotesError } = await supabase
        .schema("contracts")
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("round_id", roundId);

      if (quotesError) {
        setError(quotesError);
        setLoading(false);
        return;
      }

      const contractorsById = await fetchByIds<ContractorNameRow>(
        "contractors",
        "id, first_name, last_name, phone_number",
        (quotesData ?? []).map((q) => q.contractor_id),
      );

      setQuotes(
        (quotesData ?? []).map((q) => ({
          ...q,
          contractor: contractorsById[q.contractor_id] ?? null,
        })),
      );
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, [roundId]);

  return { round, quotes, loading, error, refetch: fetchQuotes };
}

export interface QuoteDetail extends QuoteRow {
  round: { id: string; title: string; project_id: string } | null;
  project: { name: string } | null;
}

export function useQuote(quoteId: string) {
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchQuote = async () => {
    if (!quoteId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema("contracts")
        .from("quotes")
        .select(
          `*,
          quote_items(*, round_items(name, unit, sort_order)),
          rounds(id, title, project_id)`,
        )
        .eq("id", quoteId)
        .single();

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      const row = data as unknown as QuoteRow & {
        rounds: { id: string; title: string; project_id: string } | null;
      };

      const [contractorsById, projectsById] = await Promise.all([
        fetchByIds<ContractorNameRow>(
          "contractors",
          "id, first_name, last_name, phone_number",
          [row.contractor_id],
        ),
        fetchByIds<{ id: string; name: string }>(
          "projects",
          "id, name",
          [row.rounds?.project_id],
        ),
      ]);

      setQuote({
        ...row,
        contractor: contractorsById[row.contractor_id] ?? null,
        round: row.rounds,
        project: row.rounds?.project_id
          ? (projectsById[row.rounds.project_id] ?? null)
          : null,
      });
    } catch (err) {
      setError(err as PostgrestError);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  return { quote, loading, error, refetch: fetchQuote };
}

export interface QuoteItemInput {
  round_item_id: string | null;
  work_id: string | null;
  name: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  note: string | null;
}

// quotes.total is kept in sync by the contracts.sync_quote_total trigger
// (fires on quote_items insert/update/delete) — no client-side recompute
// needed after inserting/replacing items below.

export function useCreateQuote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createQuote(input: {
    round_id: string;
    contractor_id: string;
    days_needed: number | null;
    notes: string | null;
    items: QuoteItemInput[];
  }) {
    setLoading(true);
    setError(null);

    const { data: quote, error: quoteError } = await supabase
      .schema("contracts")
      .from("quotes")
      .insert({
        round_id: input.round_id,
        contractor_id: input.contractor_id,
        days_needed: input.days_needed,
        notes: input.notes,
        total: 0,
      })
      .select("id")
      .single();

    if (quoteError) {
      setError(quoteError);
      setLoading(false);
      return { error: quoteError };
    }

    if (input.items.length > 0) {
      const { error: itemsError } = await supabase
        .schema("contracts")
        .from("quote_items")
        .insert(
          input.items.map((item) => ({
            quote_id: quote.id,
            round_item_id: item.round_item_id,
            work_id: item.work_id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            note: item.note,
          })),
        );

      if (itemsError) {
        setError(itemsError);
        setLoading(false);
        return { error: itemsError };
      }
    }

    // A round only needs an explicit "send to pricing" step in spirit — in
    // practice, the first quote entered for it is what actually opens it up
    // for pricing, so flip the status here instead of a separate action.
    // No-ops if the round is already past "draft".
    await supabase
      .schema("contracts")
      .from("rounds")
      .update({ status: "pricing" })
      .eq("id", input.round_id)
      .eq("status", "draft");

    setLoading(false);
    return { error: null, quoteId: quote.id as string };
  }

  return { createQuote, loading, error };
}

export function useUpdateQuote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function updateQuote(
    quoteId: string,
    input: {
      days_needed: number | null;
      notes: string | null;
      items: QuoteItemInput[];
    },
  ) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .schema("contracts")
      .from("quotes")
      .update({ days_needed: input.days_needed, notes: input.notes })
      .eq("id", quoteId);

    if (updateError) {
      setError(updateError);
      setLoading(false);
      return { error: updateError };
    }

    const { error: deleteError } = await supabase
      .schema("contracts")
      .from("quote_items")
      .delete()
      .eq("quote_id", quoteId);

    if (deleteError) {
      setError(deleteError);
      setLoading(false);
      return { error: deleteError };
    }

    if (input.items.length > 0) {
      const { error: itemsError } = await supabase
        .schema("contracts")
        .from("quote_items")
        .insert(
          input.items.map((item) => ({
            quote_id: quoteId,
            round_item_id: item.round_item_id,
            work_id: item.work_id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            note: item.note,
          })),
        );

      if (itemsError) {
        setError(itemsError);
        setLoading(false);
        return { error: itemsError };
      }
    }

    setLoading(false);
    return { error: null };
  }

  return { updateQuote, loading, error };
}
