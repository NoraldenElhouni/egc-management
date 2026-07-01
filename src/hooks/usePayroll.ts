import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";

export function usePayroll() {
  const [payroll, setPayroll] = useState<PayrollWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id");

    if (employeesError) {
      console.error("error fetching employees", employeesError);
      setError(employeesError);
      setLoading(false);
      return;
    }

    const { data: payrollData, error: payrollError } = await supabase
      .from("payroll")
      .select(`*, employees(first_name, last_name)`)
      .in("employee_id", employees?.map((emp) => emp.id) || [])
      .eq("status", "pending");

    if (payrollError) {
      console.error("error fetching payroll", payrollError);
      setError(payrollError);
    } else {
      setPayroll(payrollData ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const markAsPaid = async (
    payrollIds: string[],
  ): Promise<{ success: boolean; error?: string }> => {
    if (payrollIds.length === 0) return { success: true };

    try {
      const { error } = await supabase
        .from("payroll")
        .update({ status: "paid" })
        .in("id", payrollIds);

      if (error) throw error;

      // refresh local state — since the query only pulls status="pending",
      // the just-paid rows will simply drop out of `payroll` after this
      await fetchPayroll();

      return { success: true };
    } catch (err) {
      console.error("markAsPaid error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      };
    }
  };

  return {
    payroll,
    loading,
    error,
    markAsPaid,
    refetch: fetchPayroll,
  };
}
