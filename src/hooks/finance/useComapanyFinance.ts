import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { CompanyExpense } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

export function useComapnyFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [expenses, setExpense] = useState<CompanyExpense[] | null>([]);

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_expense")
        .select("*");

      if (error) {
        console.error("error fetching contractors", error);
        setError(error);
      } else {
        setExpense(data ?? []);
      }

      setLoading(false);
    }
    fetchExpenses();
  }, []);

  return { loading, error, expenses };
}
