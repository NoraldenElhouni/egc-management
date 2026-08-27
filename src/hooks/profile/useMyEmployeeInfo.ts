import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export interface MyEmployeeInfo {
  id: string;
  address: string | null;
  gender: string | null;
  nationality: string | null;
  blood_type: string | null;
  alternate_phone: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
}

export type MyEmployeeInfoUpdate = Partial<Omit<MyEmployeeInfo, "id">>;

/**
 * Not every logged-in `users` row has a matching `employees` row (e.g. a
 * lightweight admin/service account), so this fetches with maybeSingle and
 * returns null rather than erroring when there's no employee record.
 */
export function useMyEmployeeInfo(userId: string | undefined) {
  const [info, setInfo] = useState<MyEmployeeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchInfo = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("employees")
        .select(
          "id, address, gender, nationality, blood_type, alternate_phone, bank_name, bank_account_number",
        )
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setInfo(data);
    } catch (err) {
      console.error("Error fetching employee info:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const updateInfo = useCallback(
    async (updates: MyEmployeeInfoUpdate) => {
      if (!userId) return { error: new Error("لا يوجد مستخدم") };

      const { error: updateError } = await supabase
        .from("employees")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating employee info:", updateError);
        return { error: updateError };
      }

      await fetchInfo();
      return { error: null };
    },
    [userId, fetchInfo],
  );

  return { info, loading, error, refetch: fetchInfo, updateInfo };
}
