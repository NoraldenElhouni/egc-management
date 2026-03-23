import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { CompanyAccount } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";

export function useCompanyFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [account, setAccount] = useState<CompanyAccount[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("company_account")
        .select("*");

      if (error) {
        console.error("Error fetching accounts:", error);
        setError(error);
      } else {
        setAccount(data || []);
      }

      setLoading(false);
    };

    fetchAccounts();
  }, []);

  return { account, error, loading };
}
