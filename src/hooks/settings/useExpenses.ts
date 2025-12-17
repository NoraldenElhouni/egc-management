import { useEffect, useState } from "react";
import { expenses as Expense } from "../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("name", { ascending: false });

      if (error) {
        console.error("error fetching expenses", error);
        setError(error);
      } else {
        setExpenses(data ?? []);
      }
      setLoading(false);
    }
    fetchExpenses();
  }, []);

  // 👇 expose setter
  return { expenses, setExpenses, loading, error };
}
