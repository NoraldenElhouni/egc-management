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
  const { user } = useAuth(); // Move this outside of addExpense

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
        .select("expense_counter")
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
          payment_method: expenseData.payment_method,
          amount_paid: expenseData.paid_amount,
          serial_number: projectRow?.expense_counter || 0,
          phase: expenseData.phase,
          status:
            expenseData.paid_amount >= expenseData.total_amount
              ? "paid"
              : "partially_paid",
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding expense", error);
        throw error;
      }

      // update project expense counter
      const { error: counterError } = await supabase
        .from("projects")
        .update({
          expense_counter: (projectRow?.expense_counter || 0) + 1,
        })
        .eq("id", expenseData.project_id);

      if (counterError) {
        console.error("error updating project expense counter", counterError);
        setError(counterError);
      }

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
          payment_method: incomeData.payment_method,
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
