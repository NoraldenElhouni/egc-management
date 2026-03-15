import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { CompanyExpense } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";
import { CompanyExpenseFormValues } from "../../types/schema/companyFinance.schema";
import { useAuth } from "../useAuth";

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

    //add expense
    const { data: expense, error: expenseError } = await supabase
      .from("company_expense")
      .insert({
        amount: form.amount,
        company_id: "f1103f66-861b-42ce-a91d-bb9f73bb1945",
        type: form.type,
        created_by: user.id,
        reference_id: form.reference_id,
        description: form.description,
        expense_date: form.expense_date,
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
        cash_balance: account.cash_balance - expense.amount,
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

    // **Update local state so UI reflects the new expense**
    setExpense((prev) => (prev ? [...prev, expense] : [expense]));

    return { success: true };
  };

  return { loading, error, expenses, addExpense };
}
