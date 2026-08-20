import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

export type NegativePeriod =
  Database["app"]["Tables"]["project_negative_periods"]["Row"];
export type AccountNegativePeriod =
  Database["app"]["Tables"]["account_negative_periods"]["Row"];

/** Full history of negative-balance counters (periods) for a single project. */
export function useProjectNegativePeriods(projectId: string) {
  const [periods, setPeriods] = useState<NegativePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchPeriods = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("project_negative_periods")
      .select("*")
      .eq("project_id", projectId)
      .order("started_on", { ascending: false });

    if (error) {
      console.error("error fetching project counters", error);
      setError(error);
    } else {
      setPeriods(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  return { periods, loading, error, refetch: fetchPeriods };
}

/**
 * Currently open (not yet ended) negative-balance periods for every project,
 * read straight from app.project_negative_periods — the same source of truth
 * used by the per-project counters page — so days/min-balance figures always
 * match between the summary table and the project details page.
 */
export function useOpenProjectNegativePeriods() {
  const [rows, setRows] = useState<NegativePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("project_negative_periods")
      .select("*")
      .is("ended_on", null)
      .order("days_count", { ascending: false });

    if (error) {
      console.error("error fetching open project negative periods", error);
      setError(error);
    } else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, refetch: fetchRows };
}

/**
 * Currently open (not yet ended) negative-balance periods for every
 * project's account, read straight from app.account_negative_periods — see
 * useOpenProjectNegativePeriods for why this replaces the snapshot view.
 */
export function useOpenAccountNegativePeriods() {
  const [rows, setRows] = useState<AccountNegativePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("account_negative_periods")
      .select("*")
      .is("ended_on", null)
      .order("days_count", { ascending: false });

    if (error) {
      console.error("error fetching open account negative periods", error);
      setError(error);
    } else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, refetch: fetchRows };
}

/** Full history of negative-balance counters (periods) for a single project's account. */
export function useAccountNegativePeriods(projectId: string) {
  const [periods, setPeriods] = useState<AccountNegativePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchPeriods = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("account_negative_periods")
      .select("*")
      .eq("project_id", projectId)
      .order("started_on", { ascending: false });

    if (error) {
      console.error("error fetching account counters", error);
      setError(error);
    } else {
      setPeriods(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  return { periods, loading, error, refetch: fetchPeriods };
}
