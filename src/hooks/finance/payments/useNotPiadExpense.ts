import { useCallback, useEffect, useState } from "react";
import { ExpenseWithProject } from "../../../types/projects.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export function useNotPiadExpense() {
  const [expenses, setExpenses] = useState<ExpenseWithProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("project_expenses")
        .select(
          `*,
          vendors(vendor_name),
          contractors(first_name,last_name),
          projects(id, name, serial_number)
        `,
        )
        .not(
          "project_id",
          "in",
          `(5451aaae-c632-46f4-9913-8670cffcc8e7,e0a50575-bcc1-474a-98b8-8f57770a14fa,eed51009-4cfa-497c-87a1-cbf5a756f3da,f2d38514-32e0-4eeb-b6cd-fcdbed6a93ab)`,
        )
        .in("status", ["partially_paid", "unpaid"])
        .order("status")
        .order("expense_date");
      if (fetchError) {
        console.error("Error fetching vendors:", fetchError);
        setError(fetchError);
        return;
      }

      setExpenses((data as ExpenseWithProject[]) || []);
    } catch (err) {
      console.error("Unexpected error fetching vendors:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { loading, error, refetch: fetchExpenses, expenses };
}
