import { useEffect, useState } from "react";
import { Employees } from "../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export function usePayroll() {
  const [fixed, setFixed] = useState<Employees[]>([]);
  const [percentage, setPercentage] = useState<Employees[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchFixedEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("salary_type", "fixed");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setFixed(data ?? []);
      }

      setLoading(false);
    }

    async function fetchPercentageEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("salary_type", "percentages");
      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setPercentage(data ?? []);
      }
    }

    fetchPercentageEmployees();
    fetchFixedEmployees();
  }, []); // runs once on mount

  return { fixed, percentage, loading, error };
}
