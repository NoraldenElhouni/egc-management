import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

export type NegativePeriod =
  Database["app"]["Tables"]["project_negative_periods"]["Row"];
export type AccountNegativePeriod =
  Database["app"]["Tables"]["account_negative_periods"]["Row"];
export type ProjectInMinus =
  Database["app"]["Views"]["v_projects_in_minus"]["Row"];
export type AccountInMinus =
  Database["app"]["Views"]["v_accounts_in_minus"]["Row"];

/** Current negative-balance status for every project (app.v_projects_in_minus). */
export function useProjectsInMinus() {
  const [rows, setRows] = useState<ProjectInMinus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("v_projects_in_minus")
      .select("*")
      .order("days_in_minus", { ascending: false });

    if (error) {
      console.error("error fetching projects in minus", error);
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

/** Current negative-balance status for every project account (app.v_accounts_in_minus). */
export function useAccountsInMinus() {
  const [rows, setRows] = useState<AccountInMinus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("app")
      .from("v_accounts_in_minus")
      .select("*")
      .order("days_in_minus", { ascending: false });

    if (error) {
      console.error("error fetching accounts in minus", error);
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
