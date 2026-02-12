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

      const paidAmount = Number(form.amount);
      if (!paidAmount || paidAmount <= 0)
        return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };

      if (!form.currency) return { success: false, error: "العملة مطلوبة" };
      if (!form.account_id) return { success: false, error: "الحساب مطلوب" };

      // 1) Get account (for method + currency)
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", form.account_id)
        .single();

      if (accountError || !accountData) {
        console.error("Error fetching account data", accountError);
        return { success: false, error: "لا يمكن جلب بيانات الحساب" };
      }

      if (accountData.currency !== form.currency) {
        return { success: false, error: "الحساب لا يطابق العملة المختارة" };
      }

      // 2) Get project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", accountData.owner_id)
        .single();

      if (projectError || !project) {
        console.error("Error fetching project data", projectError);
        return { success: false, error: "لا يمكن جلب بيانات المشروع" };
      }

      // 3) Get percentage config
      const { data: pp, error: ppError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", accountData.owner_id)
        .eq("currency", accountData.currency)
        .eq("type", accountData.type)
        .maybeSingle();

      if (ppError || !pp) {
        console.error("Error fetching project percentage", ppError);
        throw ppError || new Error("Project percentage not found");
      }

      const paymentMethod = accountData.type; // cash / bank
      const rate = Number(pp.percentage ?? 0) / 100;

      const totalAmount = Number(expense.total_amount ?? 0);
      const alreadyPaid = Number(expense.amount_paid ?? 0);

      if (totalAmount > 0 && paidAmount > totalAmount - alreadyPaid) {
        return {
          success: false,
          error: `المبلغ أكبر من المتبقي. المتبقي: ${totalAmount - alreadyPaid}`,
        };
      }

      const paymentNo = Number(expense.payment_counter ?? 1);
      const expenseNo = Number(expense.serial_number);

      // IMPORTANT: if expenseNo is null/0 -> your serial will be bad
      if (!expenseNo || Number.isNaN(expenseNo)) {
        return {
          success: false,
          error: "رقم المصروف (serial_number) غير موجود",
        };
      }

      const serial_number = Number(`${expenseNo}.${paymentNo}`);

      // ✅ 5) Insert payment
      const { data: expensePayment, error: paymentError } = await supabase
        .from("expense_payments")
        .insert({
          expense_id: expense.id,
          amount: paidAmount,
          payment_method: paymentMethod,
          account_id: accountData.id,
          created_by: user.id,
          serial_number,
          expense_no: expenseNo,
          payment_no: paymentNo,
          invoice_no: Number(project.invoice_counter),
        })
        .select()
        .single();

      if (paymentError) {
        // If still conflict, it means another payment was inserted at same time
        // Return a clean message
        if (paymentError?.code === "23505") {
          return {
            success: false,
            error: "تم تسجيل دفعة بنفس الرقم قبل قليل، حاول مرة أخرى",
          };
        }
        throw paymentError;
      }

      // ✅ 6) Now update expense counter + amount_paid (ADD, not overwrite)
      const newAmountPaid = alreadyPaid + paidAmount;

      const { error: bumpCounterError } = await supabase
        .from("project_expenses")
        .update({
          payment_counter: paymentNo + 1,
          amount_paid: newAmountPaid,
          status: newAmountPaid >= totalAmount ? "paid" : "partially_paid",
        })
        .eq("id", expense.id)
        .eq("payment_counter", paymentNo); // ✅ optimistic lock: only update if counter hasn't changed

      if (bumpCounterError) throw bumpCounterError;

      // ✅ 7) percentage log
      const percentageAmount = paidAmount * rate;

      const { error: logError } = await supabase
        .from("project_percentage_logs")
        .insert({
          project_id: accountData.owner_id,
          expense_id: expense.id,
          payment_id: expensePayment.id,
          amount: percentageAmount,
          percentage: Number(pp.percentage ?? 0),
        });

      if (logError) throw logError;

      // ✅ 8) update account totals
      const accountTotal = paidAmount + percentageAmount;

      const { error: accountUpdateError } = await supabase
        .from("accounts")
        .update({
          balance: Number(accountData.balance) - accountTotal,
          total_expense: Number(accountData.total_expense) + paidAmount,
          total_percentage:
            Number(accountData.total_percentage) + percentageAmount,
        })
        .eq("id", accountData.id);

      if (accountUpdateError) throw accountUpdateError;

      // ✅ 9) update project_percentage totals (AMOUNTS)
      const { error: updatePPError } = await supabase
        .from("project_percentage")
        .update({
          total_percentage: Number(pp.total_percentage ?? 0) + percentageAmount,
          period_percentage:
            Number(pp.period_percentage ?? 0) + percentageAmount,
        })
        .eq("project_id", accountData.owner_id)
        .eq("currency", accountData.currency)
        .eq("type", accountData.type);

      if (updatePPError) throw updatePPError;

      //update project invoice counter
      const { error: updateProjectError } = await supabase
        .from("projects")
        .update({
          invoice_counter: Number(project.invoice_counter) + 1,
        })
        .eq("id", accountData.owner_id);

      if (updateProjectError) throw updateProjectError;

      return { success: true, error: null, data: expensePayment };
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
