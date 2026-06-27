// features/project-stats/hooks/useProjectExpenses.ts

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { ProjectExpense } from "../../types/project-stats/types";

export function useProjectExpenses(projectId: string) {
  const [data, setData] = useState<ProjectExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from("project_expenses")
      .select(
        `
        *,
        contractor:contractors ( id, first_name, last_name ),
        vendor:vendors ( id, vendor_name ),
        expense_category:expenses ( id, name )
      `,
      )
      .eq("project_id", projectId)
      .is("deleted_at", null) // exclude soft-deleted rows
      .order("expense_date", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setData((rows as ProjectExpense[]) ?? []);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
