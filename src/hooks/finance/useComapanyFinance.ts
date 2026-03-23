import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { CompanyExpense } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";
import {
  CompanyExpenseFormValues,
  CompanyExpensePaymentsValues,
} from "../../types/schema/companyFinance.schema";
import { useAuth } from "../useAuth";
import { CompanyPaymentsWithUser } from "../../types/extended.type";

export function useComapnyFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [expenses, setExpense] = useState<CompanyExpense[] | null>([]);
  const { user } = useAuth(); // ✅ call hook here at the top

  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_expense")
        .select("*");

      if (error) {
        console.error("error fetching contractors", error);
        setError(error);
      } else {
        setExpense(data ?? []);
      }

      setLoading(false);
    }
    fetchExpenses();
  }, []);

  const addExpense = async (form: CompanyExpenseFormValues) => {
    if (!user) {
      return { success: false, error: "غير مصرح" };
    }

    // fetch account
    const { data: account, error: accountError } = await supabase
      .from("company_account")
      .select("*")
      .eq("type", "main")
      .single();

    if (accountError) {
      console.error("faild to fetch company account:", accountError);
      return {
        success: false,
        error: accountError,
        message: "فشل في جلب الحساب",
      };
    }

    const status =
      form.amount_paid === 0
        ? "unpaid"
        : form.amount_paid < form.amount
          ? "partially_paid"
          : "paid";

    //add expense
    const { data: expense, error: expenseError } = await supabase
      .from("company_expense")
      .insert({
        amount: form.amount,
        company_id: "f1103f66-861b-42ce-a91d-bb9f73bb1945",
        type: form.type,
        created_by: user.id,
        serial_number: form.reference_id,
        description: form.description,
        expense_date: form.expense_date,
        amount_paid: form.amount_paid,
        status,
      })
      .select()
      .single();
    if (expenseError) {
      console.error("faild to add expense:", expenseError);
      return {
        success: false,
        error: expenseError,
        message: "فشل في انشاء المصروف",
      };
    }

    // update account
    const { error: updateAccError } = await supabase
      .from("company_account")
      .update({
        cash_balance: account.cash_balance - expense.amount_paid,
      })
      .eq("id", account.id);

    if (updateAccError) {
      console.error("faild to add expense:", updateAccError);
      return {
        success: false,
        error: updateAccError,
        message: "فشل في تحديث الحساب",
      };
    }

    if (form.amount_paid > 0) {
      const { error: paymentError } = await supabase
        .from("company_expense_payments")
        .insert({
          amount: form.amount_paid,
          expense_id: expense.id,
          payment_method: form.payment_method,
          serial_number: Number(`${form.reference_id}.1`),
          created_by: user.id,
        });

      if (paymentError) {
        console.error("faild to add expense payment:", paymentError);
        return {
          success: false,
          error: paymentError,
          message: "فشل في انشاء الدفعة ",
        };
      }
    }

    // **Update local state so UI reflects the new expense**
    setExpense((prev) => (prev ? [...prev, expense] : [expense]));

    return { success: true };
  };

  return { loading, error, expenses, addExpense };
}

export function useCompanyExpense(expenseId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [expense, setExpense] = useState<CompanyExpense | null>(null);
  const [payments, setPayments] = useState<CompanyPaymentsWithUser[]>([]);
  const { user } = useAuth();

  async function fetchExpense() {
    setLoading(true);

    const { data, error: expenseError } = await supabase
      .from("company_expense")
      .select("*")
      .eq("id", expenseId)
      .single();

    if (expenseError) {
      console.error("error fetching expense:", expenseError);
      setError(expenseError);
      setLoading(false);
      return;
    }

    setExpense(data);

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("company_expense_payments")
      .select("*, users(*)")
      .eq("expense_id", expenseId);

    if (paymentsError) {
      setError(paymentsError);
    } else {
      setPayments((paymentsData ?? []).filter(Boolean));
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const addPayments = async (
    form: CompanyExpensePaymentsValues,
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: "غير مصرح" };
    if (!expense) return { success: false, message: "المصروف غير موجود" };

    // 1. Fetch main account
    const { data: account, error: accountError } = await supabase
      .from("company_account")
      .select("*")
      .eq("type", "main")
      .single();

    if (accountError) {
      console.error("failed to fetch company account:", accountError);
      return { success: false, message: "فشل في جلب الحساب" };
    }

    // 2. Insert payment
    const { error: paymentError } = await supabase
      .from("company_expense_payments")
      .insert({
        amount: form.amount,
        expense_id: expenseId,
        payment_method: form.payment_method,
        date: form.date,
        created_by: user.id,
        serial_number: 2,
      });

    if (paymentError) {
      console.error("failed to add payment:", paymentError);
      return { success: false, message: "فشل في إنشاء الدفعة" };
    }

    // 3. Recalculate amount_paid and status
    const newAmountPaid = (expense.amount_paid ?? 0) + form.amount;
    const status =
      newAmountPaid === 0
        ? "unpaid"
        : newAmountPaid < expense.amount
          ? "partially_paid"
          : "paid";

    // 4. Update expense
    const { error: expenseUpdateError } = await supabase
      .from("company_expense")
      .update({ amount_paid: newAmountPaid, status })
      .eq("id", expenseId);

    if (expenseUpdateError) {
      console.error("failed to update expense:", expenseUpdateError);
      return { success: false, message: "فشل في تحديث المصروف" };
    }

    // 5. Deduct from account balance
    const { error: accountUpdateError } = await supabase
      .from("company_account")
      .update({ cash_balance: account.cash_balance - form.amount })
      .eq("id", account.id);

    if (accountUpdateError) {
      console.error("failed to update account:", accountUpdateError);
      return { success: false, message: "فشل في تحديث الحساب" };
    }

    // 6. Refresh local state
    await fetchExpense();

    return { success: true };
  };

  const deletePayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("company_expense_payments")
      .delete()
      .eq("id", paymentId);

    if (error) {
      console.error("failed to delete payment:", error);
      return { success: false, message: "فشل في حذف الدفعة" };
    }

    await fetchExpense();
    return { success: true };
  };

  return { payments, expense, loading, error, addPayments, deletePayment };
}
