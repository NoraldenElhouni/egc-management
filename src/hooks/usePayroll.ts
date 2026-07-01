import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";
import { Employees } from "../types/global.type";

export function usePayroll() {
  const [payroll, setPayroll] = useState<PayrollWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [fixedEmployees, setFixedEmployees] = useState<Employees[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await supabase.from("employees").select("id");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      }

      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`*, employees(first_name, last_name)`)
        .in("employee_id", data?.map((emp) => emp.id) || [])
        .eq("status", "pending");

      if (payrollError) {
        console.error("error fetching payroll", payrollError);
        setError(payrollError);
      } else {
        setPayroll(payrollData ?? []);
      }

      setLoading(false);
    }

    async function fetchFixedEmployees() {
      const { data, error } = await supabase.from("employees").select("*");

      if (error) {
        console.error("error fetching fixed employees", error);
        setError(error);
      }
      setFixedEmployees(data || []);
    }

    fetchEmployees();
    fetchFixedEmployees();
  }, []);

  return {
    payroll,
    fixedEmployees,
    loading,
    error,
  };
}
