import { useEffect, useState } from "react";
import { ProjectWithDetailsForBook } from "../../types/projects.type";
import { supabase } from "../../lib/supabaseClient";
import {
  ProjectExpenseFormValues,
  ProjectIncomeFormValues,
} from "../../types/schema/ProjectBook.schema";
import { useAuth } from "../useAuth";
import { PostgrestError } from "@supabase/supabase-js";

export function useBookProject(projectId: string) {
  const [project, setProject] = useState<ProjectWithDetailsForBook | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_incomes(*), project_expenses(*)")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("error fetching project", error);
        setError(error);
      } else {
        setProject(data);
      }

      setLoading(false);
    }

    fetchProject();
  }, [projectId]);

  const addExpense = async (expenseData: ProjectExpenseFormValues) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // get the project for expense counter for the serial number
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .select("expense_counter, percentage_taken, percentage")
        .eq("id", expenseData.project_id)
        .single();

      if (projectError) {
        console.error(
          "Error fetching project for expense counter",
          projectError
        );
        throw projectError;
      }

      const { data, error } = await supabase
        .from("project_expenses")
        .insert({
          project_id: expenseData.project_id,
          description: expenseData.description,
          total_amount: expenseData.total_amount,
          expense_date: expenseData.date,
          created_by: user.id,
          expense_type: expenseData.type,
          serial_number: projectRow?.expense_counter || 0,
          phase: expenseData.phase,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding expense", error);
        throw error;
      }

      if (expenseData.paid_amount > 0) {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "process_expense_payment", // make sure the name matches
          {
            p_amount: expenseData.paid_amount,
            p_expense_id: data.id,
            p_payment_method: expenseData.payment_method,
            p_created_by: user.id,
            p_currency: expenseData.currency,
            p_project_id: expenseData.project_id,
          }
        );

        if (rpcError) {
          console.error("Error processing expense payment", rpcError);
          throw rpcError;
        } else {
          console.log("RPC result:", rpcData);
        }
      }

      // //get the account
      // const { data: accountData, error: accountError } = await supabase
      //   .from("accounts")
      //   .select("*")
      //   .eq("owner_id", expenseData.project_id)
      //   .eq("currency", expenseData.Currency)
      //   .eq("type", expenseData.payment_method === "cash" ? "cash" : "bank")
      //   .eq("owner_type", "project")
      //   .single();

      // if (accountError) {
      //   console.error("Error fetching project account", accountError);
      //   throw accountError;
      // }

      // // create expense_payments entry
      // if (expenseData.paid_amount > 0) {
      //   const { error: paymentError } = await supabase
      //     .from("expense_payments")
      //     .insert({
      //       expense_id: data.id,
      //       amount: expenseData.paid_amount,
      //       created_at: new Date().toISOString(),
      //       payment_method: expenseData.payment_method,
      //       created_by: user.id,
      //       account_id: accountData.id,
      //       //since this is the first payment the serial number is 1 if not take it from project_expenses.payment_counter
      //       serial_number: 1,
      //     });

      //   if (paymentError) {
      //     console.error("Error adding expense payment", paymentError);
      //     throw paymentError;
      //   }
      // }

      // // decrease project account by paid amount and hold the rest as payable

      // const { error: accountUpdateError } = await supabase
      //   .from("accounts")
      //   .update({
      //     balance: accountData.balance - expenseData.paid_amount,
      //     held:
      //       accountData.held +
      //       (expenseData.total_amount - expenseData.paid_amount),
      //   })
      //   .eq("id", accountData.id);

      // if (accountUpdateError) {
      //   console.error("Error updating project account", accountUpdateError);
      //   throw accountUpdateError;
      // }

      // const percentage_taken =
      //   projectRow.percentage_taken +
      //   (expenseData.total_amount * (projectRow.percentage || 0)) / 100;

      // // update project expense counter
      // const { error: counterError } = await supabase
      //   .from("projects")
      //   .update({
      //     expense_counter: (projectRow?.expense_counter || 0) + 1,
      //     percentage_taken: percentage_taken,
      //   })
      //   .eq("id", expenseData.project_id);

      // if (counterError) {
      //   console.error("error updating project expense counter", counterError);
      //   setError(counterError);
      // }

      // Update local state with new expense
      if (data) {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            project_expenses: [...(prev.project_expenses || []), data],
            expense_counter: (prev.expense_counter || 0) + 1,
          };
        });
      }

      return { data, error: null };
    } catch (err) {
      const error = err as PostgrestError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const addIncome = async (incomeData: ProjectIncomeFormValues) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // get the project for income counter for the serial number
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .select("income_counter")
        .eq("id", incomeData.project_id)
        .single();

      if (projectError) {
        console.error(
          "Error fetching project for income counter",
          projectError
        );
        throw projectError;
      }

      const { data, error } = await supabase
        .from("project_incomes")
        .insert({
          project_id: incomeData.project_id,
          description: incomeData.description,
          amount: incomeData.amount,
          income_date: incomeData.income_date,
          created_by: user.id,
          fund: incomeData.fund,
          payment_method:
            incomeData.payment_method === "cash" ? "cash" : "cheque",
          serial_number: projectRow?.income_counter || 0,
          // related_expense: incomeData.related_expense,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding income", error);
        throw error;
      }

      // Update local state with new income
      if (data) {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            project_incomes: [...(prev.project_incomes || []), data],
            income_counter: (prev.income_counter || 0) + 1,
          };
        });
      }

      // update project income counter
      const { error: counterError } = await supabase
        .from("projects")
        .update({
          income_counter: (projectRow?.income_counter || 0) + 1,
        })
        .eq("id", incomeData.project_id);

      if (counterError) {
        console.error("error updating project income counter", counterError);
        setError(counterError);
      }

      //update the account balance and total transactions
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("owner_id", incomeData.project_id)
        .eq("currency", incomeData.currency)
        .eq("type", incomeData.payment_method === "cash" ? "cash" : "bank")
        .eq("owner_type", "project")
        .single();

      if (accountError) {
        console.error("Error fetching project account", accountError);
        throw accountError;
      }

      const { error: accountUpdateError } = await supabase
        .from("accounts")
        .update({
          balance: accountData.balance + incomeData.amount,
          total_transactions:
            accountData.total_transactions + incomeData.amount,
        })
        .eq("id", accountData.id);

      if (accountUpdateError) {
        console.error("Error updating project account", accountUpdateError);
        throw accountUpdateError;
      }

      return { data, error: null };
    } catch (err) {
      const error = err as PostgrestError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return { project, loading, error, addExpense, addIncome };
}
