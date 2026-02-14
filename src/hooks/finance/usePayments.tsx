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
      if (!user?.id)
        return { success: false, error: "غير مصرح — المستخدم غير معروف" };
      if (!paymentId) return { success: false, error: "paymentId مطلوب" };
      if (!expense?.project_id)
        return { success: false, error: "معلومات المشروع غير متوفرة" };

      const newPaidAmount = Number(form.amount);
      if (!newPaidAmount || newPaidAmount <= 0)
        return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };

      if (!form.currency) return { success: false, error: "العملة مطلوبة" };
      if (!form.account_id) return { success: false, error: "الحساب مطلوب" };

      // 0) Fetch old payment (we need old amount + old account_id + expense_id)
      const { data: oldPayment, error: oldPaymentError } = await supabase
        .from("expense_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (oldPaymentError || !oldPayment) {
        console.error("Error fetching old payment", oldPaymentError);
        return { success: false, error: "لا يمكن جلب بيانات الدفعة القديمة" };
      }

      // 1) Fetch expense (fresh) because we need totals + amount_paid
      const { data: expenseData, error: expenseError } = await supabase
        .from("project_expenses")
        .select("*")
        .eq("id", oldPayment.expense_id)
        .single();

      if (expenseError || !expenseData) {
        console.error("Error fetching expense", expenseError);
        return { success: false, error: "لا يمكن جلب بيانات المصروف" };
      }

      const totalAmount = Number(expenseData.total_amount ?? 0);
      const alreadyPaid = Number(expenseData.amount_paid ?? 0);

      const oldPaidAmount = Number(oldPayment.amount ?? 0);
      if (!oldPaidAmount || oldPaidAmount <= 0) {
        return { success: false, error: "مبلغ الدفعة القديمة غير صالح" };
      }

      // Remaining check (allow editing within remaining + old amount)
      // remaining = total - (alreadyPaid - oldPaidAmount)
      const remaining = totalAmount - (alreadyPaid - oldPaidAmount);

      if (totalAmount > 0 && newPaidAmount > remaining) {
        return {
          success: false,
          error: `المبلغ أكبر من المتبقي. المتبقي: ${remaining}`,
        };
      }

      // 2) Fetch OLD account (to reverse)
      if (!oldPayment.account_id) {
        return { success: false, error: "الحساب القديم غير متوفر" };
      }
      const { data: oldAccount, error: oldAccountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", oldPayment.account_id)
        .single();

      if (oldAccountError || !oldAccount) {
        console.error("Error fetching old account", oldAccountError);
        return { success: false, error: "لا يمكن جلب بيانات الحساب القديم" };
      }

      // 3) Fetch NEW account (to apply)
      const { data: newAccount, error: newAccountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", form.account_id)
        .single();

      if (newAccountError || !newAccount) {
        console.error("Error fetching new account", newAccountError);
        return { success: false, error: "لا يمكن جلب بيانات الحساب الجديد" };
      }

      // currency checks (same as addPayment idea)
      if (newAccount.currency !== form.currency) {
        return { success: false, error: "الحساب لا يطابق العملة المختارة" };
      }
      // IMPORTANT: payment currency must match the expense currency (usually)
      if (newAccount.currency !== expenseData.currency) {
        return { success: false, error: "عملة الحساب لا تطابق عملة المصروف" };
      }

      // 4) Fetch project (same as addPayment; invoice_counter not touched)
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", newAccount.owner_id)
        .single();

      if (projectError || !project) {
        console.error("Error fetching project data", projectError);
        return { success: false, error: "لا يمكن جلب بيانات المشروع" };
      }

      // 5) Fetch OLD percentage config (based on oldAccount.type + currency)
      const { data: oldPP, error: oldPPError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", oldAccount.owner_id)
        .eq("currency", oldAccount.currency)
        .eq("type", oldAccount.type)
        .maybeSingle();

      if (oldPPError || !oldPP) {
        console.error("Error fetching old project percentage", oldPPError);
        return {
          success: false,
          error: "لا يمكن جلب إعدادات النسبة (الحساب القديم)",
        };
      }

      // 6) Fetch NEW percentage config (based on newAccount.type + currency)
      const { data: newPP, error: newPPError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", newAccount.owner_id)
        .eq("currency", newAccount.currency)
        .eq("type", newAccount.type)
        .maybeSingle();

      if (newPPError || !newPP) {
        console.error("Error fetching new project percentage", newPPError);
        return {
          success: false,
          error: "لا يمكن جلب إعدادات النسبة (الحساب الجديد)",
        };
      }

      const oldRate = Number(oldPP.percentage ?? 0) / 100;
      const newRate = Number(newPP.percentage ?? 0) / 100;

      const oldPercentageAmount = oldPaidAmount * oldRate;
      const newPercentageAmount = newPaidAmount * newRate;

      const oldAccountTotal = oldPaidAmount + oldPercentageAmount;
      const newAccountTotal = newPaidAmount + newPercentageAmount;

      // 7) Reverse OLD effects
      // 7.1 reverse account totals (give money back to old account)
      const { error: reverseOldAccountError } = await supabase
        .from("accounts")
        .update({
          balance: Number(oldAccount.balance) + oldAccountTotal,
          total_expense: Number(oldAccount.total_expense) - oldPaidAmount,
          total_percentage:
            Number(oldAccount.total_percentage) - oldPercentageAmount,
        })
        .eq("id", oldAccount.id);

      if (reverseOldAccountError) throw reverseOldAccountError;

      // 7.2 reverse project_percentage totals (subtract old percentage)
      const { error: reverseOldPPError } = await supabase
        .from("project_percentage")
        .update({
          total_percentage:
            Number(oldPP.total_percentage ?? 0) - oldPercentageAmount,
          period_percentage:
            Number(oldPP.period_percentage ?? 0) - oldPercentageAmount,
        })
        .eq("project_id", oldAccount.owner_id)
        .eq("currency", oldAccount.currency)
        .eq("type", oldAccount.type);

      if (reverseOldPPError) throw reverseOldPPError;

      // 7.3 reverse expense.amount_paid (remove old paid)
      const amountPaidAfterReverse = alreadyPaid - oldPaidAmount;

      // 8) Apply NEW effects
      // 8.1 update payment row (amount + account_id + payment_method)
      const { data: updatedPayment, error: updatePaymentError } = await supabase
        .from("expense_payments")
        .update({
          amount: newPaidAmount,
          account_id: newAccount.id,
          payment_method: newAccount.type, // cash/bank
          updated_by: user.id,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updatePaymentError) throw updatePaymentError;

      // 8.2 update percentage log row for this payment (same payment_id)
      // if you might have multiple logs, keep it .eq("payment_id", paymentId) and update all
      const { error: updateLogError } = await supabase
        .from("project_percentage_logs")
        .update({
          amount: newPercentageAmount,
          percentage: Number(newPP.percentage ?? 0),
        })
        .eq("payment_id", paymentId);

      if (updateLogError) throw updateLogError;

      // 8.3 apply to new account (subtract money from new account)
      const { error: applyNewAccountError } = await supabase
        .from("accounts")
        .update({
          balance: Number(newAccount.balance) - newAccountTotal,
          total_expense: Number(newAccount.total_expense) + newPaidAmount,
          total_percentage:
            Number(newAccount.total_percentage) + newPercentageAmount,
        })
        .eq("id", newAccount.id);

      if (applyNewAccountError) throw applyNewAccountError;

      // 8.4 apply to new project_percentage
      const { error: applyNewPPError } = await supabase
        .from("project_percentage")
        .update({
          total_percentage:
            Number(newPP.total_percentage ?? 0) + newPercentageAmount,
          period_percentage:
            Number(newPP.period_percentage ?? 0) + newPercentageAmount,
        })
        .eq("project_id", newAccount.owner_id)
        .eq("currency", newAccount.currency)
        .eq("type", newAccount.type);

      if (applyNewPPError) throw applyNewPPError;

      // 8.5 update expense.amount_paid + status
      const newAmountPaid = amountPaidAfterReverse + newPaidAmount;

      const nextStatus =
        totalAmount > 0 && newAmountPaid >= totalAmount
          ? "paid"
          : "partially_paid";

      const { error: updateExpenseError2 } = await supabase
        .from("project_expenses")
        .update({
          amount_paid: newAmountPaid,
          status: nextStatus,
        })
        .eq("id", expenseData.id);

      if (updateExpenseError2) throw updateExpenseError2;

      return { success: true, error: null, data: updatedPayment };
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
