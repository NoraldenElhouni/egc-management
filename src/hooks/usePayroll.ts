import { useEffect, useState } from "react";
import { Employees } from "../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";

export function usePayroll() {
  const [fixed, setFixed] = useState<Employees[]>([]);
  const [percentage, setPercentage] = useState<Employees[]>([]);
  const [fixedPayroll, setfixedPayroll] = useState<PayrollWithRelations[]>([]);
  const [percentagePayroll, setPercentagePayroll] = useState<
    PayrollWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchFixedEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("salary_type", "fixed");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setFixed(data ?? []);
      }

      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`*, employees (first_name, last_name)`)
        .in("employee_id", data?.map((emp) => emp.id) || []);

      if (payrollError) {
        console.error("error fetching payroll", payrollError);
        setError(payrollError);
      } else {
        setfixedPayroll(payrollData ?? []);
      }

      setLoading(false);
    }

    async function fetchPercentageEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("salary_type", "percentages");
      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setPercentage(data ?? []);
      }
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`*, employees (first_name, last_name)`)
        .in("employee_id", data?.map((emp) => emp.id) || []);

      if (payrollError) {
        console.error("error fetching payroll", payrollError);
        setError(payrollError);
      } else {
        setPercentagePayroll(payrollData ?? []);
      }
      setLoading(false);
    }

    fetchPercentageEmployees();
    fetchFixedEmployees();
  }, []); // runs once on mount

  return { fixed, percentage, fixedPayroll, percentagePayroll, loading, error };
}
