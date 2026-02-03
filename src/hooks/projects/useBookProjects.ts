import { useEffect, useState } from "react";
import { ProjectWithDetailsForBook } from "../../types/projects.type";
import { supabase } from "../../lib/supabaseClient";
import {
  ProjectExpenseFormValues,
  ProjectIncomeFormValues,
  ProjectRefundValues,
} from "../../types/schema/ProjectBook.schema";
import { useAuth } from "../useAuth";
import { PostgrestError } from "@supabase/supabase-js";
import {
  Currency,
  ExpenseType,
  Phase,
  ProjectExpenses,
} from "../../types/global.type";
import { normalizeUuid } from "../../utils/helpper";

export function useBookProject(projectId: string) {
  const [project, setProject] = useState<ProjectWithDetailsForBook | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(
          "*, project_incomes(*), project_expenses(*), project_balances(*), project_refund(*)",
        )
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

      // ✅ Basic validations (optional but recommended)
      if (!expenseData.project_id) throw new Error("Project is required");
      if (!expenseData.total_amount || expenseData.total_amount <= 0)
        throw new Error("Total amount must be > 0");
      if (!expenseData.currency) throw new Error("Currency is required");
      if (!expenseData.type) throw new Error("Expense type is required");
      if (!expenseData.phase) throw new Error("Phase is required");

      // ✅ If paid_amount > 0, ensure payment_method exists
      if ((expenseData.paid_amount ?? 0) > 0 && !expenseData.payment_method) {
        throw new Error("payment_method is required when paid_amount > 0");
      }

      // ✅ Call DB RPC that does:
      // - lock project
      // - insert expense + serial_number
      // - increment expense_counter
      // - update project_balances (held + total_expense)
      // - if paid_amount > 0: calls rpc_process_expense_payment internally
      const { data, error } = await supabase.rpc("rpc_add_project_expense", {
        p_project_id: expenseData.project_id,
        p_description: expenseData.description ?? null,
        p_total_amount: expenseData.total_amount,
        p_expense_date: expenseData.date ?? null,
        p_created_by: user.id,
        p_expense_type: expenseData.type, // ✅ must match enum expense_type
        p_phase: expenseData.phase, // ✅ must match enum phase_type
        p_currency: expenseData.currency, // ✅ must match enum currency_type
        p_contractor_id: expenseData.contractor_id ?? undefined,
        p_expense_id: expenseData.expense_id ?? undefined,
        p_paid_amount: expenseData.paid_amount ?? 0,
        p_payment_method:
          (expenseData.paid_amount ?? 0) > 0
            ? expenseData.payment_method
            : undefined, // ✅ enum payment_method
      });

      if (error) {
        console.error("Error adding expense via RPC", error);
        throw error;
      }

      // ✅ Update local state (same idea you had before)
      if (data) {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            project_expenses: [data, ...(prev.project_expenses ?? [])],
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
          projectError,
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
          client_name: incomeData.client_name,
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

      // get the project balance and update it
      const { data: projectData, error: projectBalanceError } = await supabase
        .from("project_balances")
        .select("*")
        .eq("project_id", incomeData.project_id)
        .eq("currency", incomeData.currency)
        .single();

      if (projectBalanceError) {
        console.error("Error fetching project balance", projectBalanceError);
        throw projectBalanceError;
      }

      const { error: projectBalanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: projectData.balance + incomeData.amount,
          total_transactions:
            projectData.total_transactions + incomeData.amount,
        })
        .eq("id", projectData.id);

      if (projectBalanceUpdateError) {
        console.error(
          "Error updating project balance",
          projectBalanceUpdateError,
        );
        throw projectBalanceUpdateError;
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

  const addRefund = async (form: ProjectRefundValues) => {
    // 1 fetch project percentage (cash or bank)
    const { data: projectPercentage, error: projectPercentageError } =
      await supabase
        .from("project_percentage")
        .select("*")
        .eq("project_id", form.project_id)
        .eq("type", form.payment_method)
        .eq("currency", form.currency)
        .single();

    if (projectPercentageError) {
      console.error(
        "Error fetching project percentage",
        projectPercentageError,
      );
      return { success: false, message: "حدث خطأ أثناء جلب نسبة المشروع" };
    }
    // 2 fetch project account
    const { data: projectAccount, error: projectAccountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("owner_id", form.project_id)
      .eq("owner_type", "project")
      .eq("type", form.payment_method === "cash" ? "cash" : "bank")
      .eq("currency", form.currency)
      .single();

    if (projectAccountError || !projectAccount) {
      console.error("Error fetching project account", projectAccountError);
      return { success: false, message: "حدث خطأ أثناء جلب حساب المشروع" };
    }
    // 3 fetch project balance
    const { data: projectBalance, error: projectBalanceError } = await supabase
      .from("project_balances")
      .select("*")
      .eq("project_id", form.project_id)
      .eq("currency", form.currency)
      .single();

    if (projectBalanceError) {
      console.error("Error fetching project balance", projectBalanceError);
      return { success: false, message: "حدث خطأ أثناء جلب رصيد المشروع" };
    }
    // 4 fetch project refund counter
    const { data: companyData, error: companyDataError } = await supabase
      .from("projects")
      .select("refund_counter")
      .eq("id", form.project_id)
      .single();

    if (companyDataError) {
      console.error("Error fetching project refund counter", companyDataError);
      return {
        success: false,
        message: "حدث خطأ أثناء جلب عداد استرداد المشروع",
      };
    }

    // 5 insert project refund
    if (!user?.id) {
      return { success: false, message: "المستخدم غير مصرح له" };
    }

    // ensure required fields are present for the insert; cast/assign to ProjectRefund
    const refundPayload = {
      amount: form.amount as number,
      project_id: form.project_id,
      description: form.description ?? null,
      created_by: user.id,
      payment_method: form.payment_method,
      income_date: form.income_date ?? undefined,
      serial_number: companyData?.refund_counter || 0,
      currency: form.currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: refundError } = await supabase
      .from("project_refund")
      .insert(refundPayload)
      .select()
      .single();

    if (refundError) {
      console.error("Error inserting project refund", refundError);
      return { success: false, message: "حدث خطأ أثناء إضافة استرداد المشروع" };
    }

    // 6. Update project percentage - Calculate percentage and subtract (can go negative)
    const percentageAmount =
      form.amount * ((projectPercentage?.percentage || 0) / 100);

    const { error: projectPercentageUpdateError } = await supabase
      .from("project_percentage")
      .update({
        period_percentage:
          (projectPercentage?.period_percentage || 0) - percentageAmount,
        total_percentage:
          (projectPercentage?.total_percentage || 0) - percentageAmount,
      })
      .eq("id", projectPercentage?.id);

    if (projectPercentageUpdateError) {
      console.error(
        "Error updating project percentage",
        projectPercentageUpdateError,
      );
      return { success: false, message: "حدث خطأ أثناء تحديث نسبة المشروع" };
    }
    // 7 update project acccount
    const { error: projectAccountUpdateError } = await supabase
      .from("accounts")
      .update({
        balance: projectAccount.balance + form.amount,
      })
      .eq("id", projectAccount?.id);

    if (projectAccountUpdateError) {
      console.error(
        "Error updating project account",
        projectAccountUpdateError,
      );
      return { success: false, message: "حدث خطأ أثناء تحديث حساب المشروع" };
    }
    // 8 update project balance
    const { error: projectBalanceUpdateError } = await supabase
      .from("project_balances")
      .update({
        balance: projectBalance.balance + form.amount,
        total_expense: projectBalance.total_expense - form.amount,
      })
      .eq("id", projectBalance?.id);

    if (projectBalanceUpdateError) {
      console.error(
        "Error updating project balance",
        projectBalanceUpdateError,
      );
      return { success: false, message: "حدث خطأ أثناء تحديث رصيد المشروع" };
    }
    // 9 update project refund counter
    const { error: projectRefundCounterUpdateError } = await supabase
      .from("projects")
      .update({
        refund_counter: (companyData?.refund_counter || 0) + 1,
      })
      .eq("id", form.project_id);

    if (projectRefundCounterUpdateError) {
      console.error(
        "Error updating project refund counter",
        projectRefundCounterUpdateError,
      );
      return {
        success: false,
        message: "حدث خطأ أثناء تحديث عداد استرداد المشروع",
      };
    }

    return { success: true };
  };

  return {
    project,
    loading,
    error,
    addExpense,
    addIncome,
    addRefund,
  };
}

export function useProjectExpenseActions() {
  const { user } = useAuth();

  const updateExpense = async (payload: {
    expense_id: string;
    description?: string | null;
    total_amount?: number | null;
    expense_date?: string | null; // yyyy-mm-dd
    expense_type: ExpenseType; // expense_type
    phase: Phase; // phase_type
    currency: Currency; // currency_type
    contractor_id?: string | null;
    expense_ref_id?: string | null;
  }) => {
    if (!user?.id) return { success: false, error: "غير مصرح" };
    console.log("Updating expense with payload:", payload);

    const { data, error } = await supabase.rpc("rpc_update_project_expense", {
      p_expense_id: payload.expense_id,
      p_description: payload.description ?? "",
      p_total_amount: payload.total_amount ?? 0,
      p_expense_date: payload.expense_date ?? "",
      p_expense_type: payload.expense_type,
      p_phase: payload.phase,
      p_currency: payload.currency,
      p_contractor_id: normalizeUuid(payload.contractor_id),
      p_expense_ref_id: normalizeUuid(payload.expense_ref_id),
      p_updated_by: user.id,
    });

    if (error) {
      console.log("RPC error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data: data as ProjectExpenses };
  };

  const deleteExpense = async (payload: {
    expense_id: string;
    currency: Currency; // currency_type
  }) => {
    if (!user?.id) return { success: false, error: "غير مصرح" };

    const { data, error } = await supabase.rpc(
      "rpc_soft_delete_project_expense",
      {
        p_expense_id: payload.expense_id,
        p_currency: payload.currency,
        p_deleted_by: user.id,
      },
    );

    if (error) {
      console.log("RPC error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };

  return { updateExpense, deleteExpense };
}
