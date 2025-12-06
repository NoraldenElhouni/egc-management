import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Account,
  Employees,
  ProjectExpenses,
} from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";
import {
  ContractPaymentWithRelations,
  projectExpensePayments,
  ProjectExpenseWithName,
} from "../../types/extended.type";
import { PostgrestError } from "@supabase/supabase-js";
import { ExpensePaymentFormValues } from "../../types/schema/ProjectBook.schema";
import { useAuth } from "../useAuth";
import { processExpensePayment } from "../../services/payments/setPayments";

export function usePayments() {
  const [payments, setPayments] = useState<ProjectExpenseWithName[]>([]);
  const [contractPayments, setContractPayments] = useState<
    ContractPaymentWithRelations[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // guard to avoid state updates after unmount
  const mountedRef = useRef(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // fetch expenses and contract payments in parallel
      const [expensesRes, contractRes] = await Promise.all([
        supabase
          .from("project_expenses")
          .select("*, projects(name)")
          .eq("status", "partially_paid"),
        supabase
          .from("contract_payments")
          .select(
            "*, contractors(first_name, last_name), contracts(projects(name))"
          )
          .eq("status", "pending"),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (contractRes.error) throw contractRes.error;

      const expenses = expensesRes.data ?? [];
      const contractData = contractRes.data ?? [];

      // get unique employee ids and fetch employees only if needed
      const employeeIds = Array.from(
        new Set(contractData.map((cp) => cp.created_by).filter(Boolean))
      );

      let employeeData: Employees[] = [];
      if (employeeIds.length) {
        const empRes = await supabase
          .from("employees")
          .select("*")
          .in("id", employeeIds);
        if (empRes.error) throw empRes.error;
        employeeData = empRes.data ?? [];
      }

      // attach employee to contract payments
      const contractPaymentsWithEmployees = contractData.map((cp) => ({
        ...cp,
        employee: employeeData.find((e) => e.id === cp.created_by) ?? null,
      }));

      if (!mountedRef.current) return;

      setPayments(expenses as ProjectExpenseWithName[]);
      setContractPayments(
        contractPaymentsWithEmployees as ContractPaymentWithRelations[]
      );
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = (err as PostgrestError)?.message ?? String(err);
      setError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // initial load
    fetchPayments();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPayments]);

  return { payments, contractPayments, loading, error, refetch: fetchPayments };
}

export function useExpensePayments(expenseId: string) {
  const [payment, setPayment] = useState<projectExpensePayments[] | null>(null);
  const [expense, setExpense] = useState<ProjectExpenses | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPayment() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("expense_payments")
          .select("*, accounts(currency, id, type), users(*)")
          .eq("expense_id", expenseId);
        if (error) throw error;

        const { data: expenseData, error: expenseError } = await supabase
          .from("project_expenses")
          .select("*")
          .eq("id", expenseId)
          .single();
        if (expenseError) throw expenseError;

        const { data: accountsData, error: accountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("owner_type", "project")
          .eq("owner_id", expenseData.project_id);
        if (accountsError) throw accountsError;

        setPayment(data);
        setExpense(expenseData);
        setAccounts(accountsData ?? []);
      } catch (err: unknown) {
        setError((err as PostgrestError)?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();
  }, [expenseId]);

  const addPayment = async (form: ExpensePaymentFormValues) => {
    setSubmitting(true);
    try {
      // Validate user
      if (!user?.id) {
        return { success: false, error: "غير مصرح — المستخدم غير معروف" };
      }

      // Validate expense and project_id
      if (!expense?.project_id) {
        return { success: false, error: "معلومات المشروع غير متوفرة" };
      }

      // Validate amount
      if (!form.amount || form.amount <= 0) {
        return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };
      }

      // Validate currency
      if (!form.currency) {
        return { success: false, error: "العملة مطلوبة" };
      }

      //fetch the account type
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("type")
        .eq("id", form.account_id)
        .single();

      if (accountError) {
        console.error("Error fetching account data", accountError);
        return { success: false, error: "لا يمكن جلب بيانات الحساب" };
      }

      const processPayment = await processExpensePayment({
        expense_id: expenseId,
        project_id: expense?.project_id,
        amount: form.amount,
        currency: form.currency,
        payment_method: accountData?.type,
        created_by: user.id,
      });

      if (!processPayment.success) {
        console.error("Error processing expense payment", processPayment.error);
        return { success: false, error: processPayment.error };
      }

      return { success: true, error: null };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    payment,
    expense,
    accounts,
    loading,
    error,
    submitting,
    addPayment,
  };
}
