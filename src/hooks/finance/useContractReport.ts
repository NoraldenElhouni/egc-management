import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { FullContractReport } from "../../types/extended.type";

export function useContractReport(expenseId: string) {
  const [report, setReport] = useState<FullContractReport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const { data: exp, error: expError } = await supabase
          .from("project_expenses")
          .select("contract_id")
          .eq("id", expenseId)
          .single();

        if (expError) {
          setError(expError);
          setLoading(false);
          return;
        }
        const contractId = exp?.contract_id;

        if (contractId == null) {
          setReport([]);
          setLoading(false);
          return;
        }

        const { data, error: reportError } = await supabase
          .from("contract_reports")
          .select(
            "*, contracts(*), projects(name), employees(first_name,last_name)",
          )
          .eq("contract_id", contractId);

        if (reportError) {
          setError(reportError);
          setReport([]);
        } else {
          setReport((data as FullContractReport[]) ?? []);
        }
      } catch (err: unknown) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [expenseId]);
  return { report, loading, error };
}
