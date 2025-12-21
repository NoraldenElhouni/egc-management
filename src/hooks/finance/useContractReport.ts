import { useEffect, useState } from "react";
import { ContractReport } from "../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export function useContractReport(expenseId: string) {
  const [report, setReport] = useState<ContractReport[] | null>(null);
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
          .select("*")
          .eq("contract_id", contractId);

        if (reportError) {
          setError(reportError);
          setReport([]);
        } else {
          setReport((data as ContractReport[]) ?? []);
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
