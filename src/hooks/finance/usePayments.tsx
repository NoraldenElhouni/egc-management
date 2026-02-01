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
            "*, contractors(first_name, last_name), contracts(projects(name))",
          )
          .eq("status", "pending"),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (contractRes.error) throw contractRes.error;

      const expenses = expensesRes.data ?? [];
      const contractData = contractRes.data ?? [];

      // get unique employee ids and fetch employees only if needed
      const employeeIds = Array.from(
        new Set(contractData.map((cp) => cp.created_by).filter(Boolean)),
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
        contractPaymentsWithEmployees as ContractPaymentWithRelations[],
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
      if (!user?.id)
        return { success: false, error: "غير مصرح — المستخدم غير معروف" };

      if (!expense?.project_id)
        return { success: false, error: "معلومات المشروع غير متوفرة" };

      if (!expenseId) return { success: false, error: "المصروف غير متوفر" };

      if (!form.amount || form.amount <= 0)
        return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };

      if (!form.currency) return { success: false, error: "العملة مطلوبة" };

      if (!form.account_id) return { success: false, error: "الحساب مطلوب" };

      // fetch account type + currency
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("type, currency")
        .eq("id", form.account_id)
        .single();

      if (accountError || !accountData) {
        console.error("Error fetching account data", accountError);
        return { success: false, error: "لا يمكن جلب بيانات الحساب" };
      }

      // ensure currency matches
      if (accountData.currency !== form.currency) {
        return { success: false, error: "الحساب لا يطابق العملة المختارة" };
      }

      // ✅ call DB RPC (enums)
      const { data, error } = await supabase.rpc(
        "rpc_process_expense_payment",
        {
          p_expense_id: expenseId,
          p_project_id: expense.project_id,
          p_amount: form.amount,

          // IMPORTANT: send enum values exactly (LYD/USD/EUR)
          p_currency: form.currency,

          // IMPORTANT: send enum values exactly (cash/bank)
          p_payment_method: accountData.type,

          p_created_by: user.id,
        },
      );

      if (error) {
        console.error("Error processing expense payment via RPC", error);
        return {
          success: false,
          error: error.message || "حدث خطأ أثناء إضافة الدفعة",
        };
      }

      // optionally you can update UI with returned updated expense "data"
      return { success: true, error: null, data };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const editPayment = async (
    paymentId: string,
    form: ExpensePaymentFormValues,
  ) => {
    setSubmitting(true);
    try {
      if (!user?.id) return { success: false, error: "غير مصرح" };
      if (!paymentId) return { success: false, error: "paymentId مطلوب" };
      if (!expense?.project_id)
        return { success: false, error: "معلومات المشروع غير متوفرة" };

      if (!form.amount || form.amount <= 0)
        return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };

      if (!form.account_id) return { success: false, error: "الحساب مطلوب" };

      const { data, error } = await supabase.rpc("rpc_update_expense_payment", {
        p_payment_id: paymentId,
        p_new_amount: form.amount,
        p_new_account_id: form.account_id,
        p_updated_by: user.id,
      });

      if (error) {
        console.error("Error editing payment via RPC", error);
        return { success: false, error: error.message || "فشل تعديل الدفعة" };
      }

      return { success: true, error: null, data };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    setSubmitting(true);
    try {
      if (!user?.id) return { success: false, error: "غير مصرح" };
      if (!paymentId) return { success: false, error: "الدفعة غير متوفرة" };

      const { data, error } = await supabase.rpc("rpc_delete_expense_payment", {
        p_payment_id: paymentId,
        p_deleted_by: user.id,
      });

      if (error) {
        console.error("delete payment rpc error", error);
        return { success: false, error: error.message };
      }

      // refresh local state بدون reload
      setPayment((prev) =>
        prev ? prev.filter((p) => p.id !== paymentId) : prev,
      );

      // expense يرجع من rpc داخل data.expense
      const rpcResult = data as { expense?: ProjectExpenses } | null;
      if (rpcResult?.expense) setExpense(rpcResult.expense);

      return { success: true, data };
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
    editPayment,
    deletePayment,
  };
}
