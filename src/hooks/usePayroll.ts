import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";
import { PercentageDistributionFormValues } from "../types/schema/PercentageDistribution.schema";

export function usePayroll() {
  const [payroll, setPayroll] = useState<PayrollWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

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
        .in("employee_id", data?.map((emp) => emp.id) || []);

      if (payrollError) {
        console.error("error fetching payroll", payrollError);
        setError(payrollError);
      } else {
        setPayroll(payrollData ?? []);
      }

      setLoading(false);
    }

    fetchEmployees();
  }, []); // runs once on mount

  const PercentageDistribution = async (
    form: PercentageDistributionFormValues
  ) => {
    // 1 fetch account the compony and the employees assignments to get their account ids
    const { data: companyData, error: companyDataError } = await supabase
      .from("company")
      .select("*")
      .single();

    if (companyDataError) {
      console.error("error fetching company data", companyDataError);
      return { success: false, message: "لا يمكن جلب بيانات الشركة" };
    }

    const { data: companyAccount, error: companyError } = await supabase
      .from("accounts")
      .select("*")
      .eq("owner_id", companyData?.id)
      .eq("owner_type", "company")
      .single();

    if (companyError) {
      console.error("error fetching company account", companyError);
      return { success: false, message: "لا يمكن جلب حساب الشركة" };
    }

    // 2 create payroll entries for each employee and the company
    // 3 reset the period percentage to 0 and the period start to today
    // 4 return success or failure

    return { success: true };
  };
  return { payroll, loading, error, PercentageDistribution };
}

export function useDetailedPayroll(id: string) {
  const [payroll, setPayroll] = useState<PayrollWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchPayroll() {
      setLoading(true);
      const { data, error } = await supabase
        .from("payroll")
        .select(`*, employees (first_name, last_name, salary_type)`)
        .eq("id", id)
        .single();
      if (error) {
        console.error("error fetching payroll", error);
        setError(error);
      } else {
        setPayroll(data);
      }
      setLoading(false);
    }
    fetchPayroll();
  }, [id]); // runs once on mount or when id changes

  return { payroll, loading, error };
}
