import { useCallback, useEffect, useState } from "react";
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

    fetchEmployees();
  }, []); // runs once on mount

  const PercentageDistribution = async (
    form: PercentageDistributionFormValues
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      return { success: false, message: "المستخدم غير مسجل الدخول" };
    }
    const user = userData.user;
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
      .eq("currency", "LYD")
      .single();

    if (companyError) {
      console.error("error fetching company account", companyError);
      return { success: false, message: "لا يمكن جلب حساب الشركة" };
    }

    // 1.1 update balances of each account
    const { error: companyBalanceError } = await supabase
      .from("accounts")
      .update({
        balance: (companyAccount.balance || 0) + form.company.amount,
      })
      .eq("id", companyAccount.id);

    if (companyBalanceError) {
      console.error(
        "error updating company account balance",
        companyBalanceError
      );
      return { success: false, message: "فشل تحديث رصيد حساب الشركة" };
    }

    // 2 create payroll entries for each employee and the company
    for (const emp of form.employees) {
      const { error: payrollError } = await supabase.from("payroll").insert([
        {
          employee_id: emp.id,
          pay_date: new Date().toISOString(),
          total_salary: emp.amount,
          percentage_salary: emp.amount,
          created_by: user.id,
          basic_salary: 0,
          payment_method: "cash",
          status: "pending",
        },
      ]);

      if (payrollError) {
        console.error("error creating payroll entry", payrollError);
        setError(payrollError);
        return { success: false, message: "فشل إنشاء قيد الرواتب" };
      }
    }

    // 3 reset the period percentage to 0 and the period start to today
    const { error: percentageError } = await supabase
      .from("project_percentage")
      .update({
        period_percentage: 0,
        period_start: new Date().toISOString(),
      })
      .eq("project_id", form.project_id)
      .eq("currency", "LYD");

    if (percentageError) {
      console.error("error updating project percentage", percentageError);
      return { success: false, message: "فشل تحديث نسبة المشروع" };
    }

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
