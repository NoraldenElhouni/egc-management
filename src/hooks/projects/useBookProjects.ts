import { useEffect, useState } from "react";
import { ProjectWithDetailsForBook } from "../../types/projects.type";
import { supabase } from "../../lib/supabaseClient";
import {
  ProjectExpenseFormValues,
  ProjectExpensePercentageFormValues,
  ProjectIncomeFormValues,
  ProjectRefundValues,
} from "../../types/schema/ProjectBook.schema";
import { useAuth } from "../useAuth";
import { PostgrestError } from "@supabase/supabase-js";
import { Currency, ExpenseType, Phase } from "../../types/global.type";

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
          "*, project_incomes(*), project_expenses(*, vendors(vendor_name), contractors(first_name,last_name)), project_balances(*), project_refund(*), accounts(*)",
        )
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("error fetching project", error);
        setError(error);
      } else {
        const projectWithNames: ProjectWithDetailsForBook = {
          ...data,
          project_expenses: (data.project_expenses ?? []).map((expense) => {
            const contractorName = [
              expense.contractors?.first_name,
              expense.contractors?.last_name,
            ]
              .filter(Boolean)
              .join(" ");

            return {
              ...expense,
              vendor_name: expense.vendors?.vendor_name ?? undefined,
              contract_name: contractorName || undefined,
            };
          }),
        };

        setProject(projectWithNames);
      }

      setLoading(false);
    }

    fetchProject();
  }, [projectId]);

  const addExpense = async (expenseData: ProjectExpenseFormValues) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) throw new Error("User not authenticated");

      if (!expenseData.project_id) throw new Error("Project is required");
      if (!expenseData.total_amount || expenseData.total_amount <= 0)
        throw new Error("Total amount must be > 0");
      if (!expenseData.currency) throw new Error("Currency is required");
      if (!expenseData.type) throw new Error("Expense type is required");
      if (!expenseData.phase) throw new Error("Phase is required");

      const paidAmount = expenseData.paid_amount ?? 0;

      if (paidAmount > 0 && !expenseData.payment_method) {
        throw new Error("payment_method is required when paid_amount > 0");
      }

      // ✅ Get percentage rate (do NOT depend on payment_method if it's global)
      const { data: pp, error: ppError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", expenseData.project_id)
        .eq("currency", expenseData.currency)
        .eq("type", expenseData.payment_method ?? "cash") // if payment_method is null/undefined, default to "cash" percentage
        .maybeSingle();

      if (ppError || !pp) {
        console.error("Error fetching project percentage", ppError);
        throw ppError || new Error("Project percentage not found");
      }

      const rate = (pp?.percentage ?? 0) / 100;

      let status: "unpaid" | "paid" | "partially_paid";
      if (paidAmount === 0) status = "unpaid";
      else if (paidAmount === expenseData.total_amount) status = "paid";
      else status = "partially_paid";

      // 1) Insert expense invoice
      const { data: expense, error: expenseErr } = await supabase
        .from("project_expenses")
        .insert({
          project_id: expenseData.project_id,
          description: expenseData.description,
          total_amount: expenseData.total_amount,
          expense_date: expenseData.date,
          created_by: user.id,
          phase: expenseData.phase,
          expense_type: expenseData.type,
          status,
          amount_paid: paidAmount,
          serial_number: project?.expense_counter || 0,
          contractor_id: expenseData.contractor_id ?? undefined,
          vendor_id: expenseData.vendor_id ?? undefined,
          currency: expenseData.currency,
        })
        .select()
        .single();

      if (expenseErr) throw expenseErr;

      // ✅ 2) Update project_balances (invoice-based net)
      const invoicePercentage = expenseData.total_amount * rate;
      const netDelta = expenseData.total_amount + invoicePercentage;

      const { data: balanceData, error: balanceError } = await supabase
        .from("project_balances")
        .select("*")
        .eq("project_id", expenseData.project_id)
        .eq("currency", expenseData.currency)
        .single();

      if (balanceError) throw balanceError;

      const { error: balanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: (balanceData?.balance || 0) - netDelta,
          total_expense:
            (balanceData?.total_expense || 0) + expenseData.total_amount,
          total_percentage:
            (balanceData?.total_percentage || 0) + invoicePercentage,
        })
        .eq("id", balanceData?.id);

      if (balanceUpdateError) throw balanceUpdateError;

      // 3) If paid > 0, insert payment + percentage log + update account
      if (paidAmount > 0) {
        const paymentMethod = expenseData.payment_method; // safe now

        const serial_number = Number(
          `${project?.expense_counter}.${expense.payment_counter}`,
        );

        // fetch account
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("owner_id", expenseData.project_id)
          .eq("owner_type", "project")
          .eq("type", expenseData.payment_method ?? "cash")
          .eq("currency", expenseData.currency)
          .single();

        if (accountError || !accountData) {
          console.error("Error fetching project account", accountError);
          throw accountError || new Error("Project account not found");
        }

        const { data: expensePayment, error: paymentError } = await supabase
          .from("expense_payments")
          .insert({
            expense_id: expense.id,
            amount: paidAmount,
            payment_method: paymentMethod,
            account_id: accountData.id,
            created_by: user.id,
            serial_number,
            expense_no: expense.serial_number,
            payment_no: expense.payment_counter,
            invoice_no: project?.invoice_counter,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        const percentageAmount = paidAmount * rate;

        const { error: logError } = await supabase
          .from("project_percentage_logs")
          .insert({
            project_id: expenseData.project_id,
            expense_id: expense.id,
            payment_id: expensePayment.id,
            amount: percentageAmount,
            percentage: pp?.percentage ?? 0,
          });

        if (logError) throw logError;

        const accountTotal = paidAmount + percentageAmount;

        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({
            balance: accountData.balance - accountTotal,
            total_expense: accountData.total_expense + paidAmount,
            total_percentage: accountData.total_percentage + percentageAmount,
          })
          .eq("id", accountData.id);

        if (accountUpdateError) throw accountUpdateError;

        // Optional: if project_percentage totals are meant to track PAID percentage (cash basis)
        // keep this update; otherwise remove it.
        const { error: UpdatePPError } = await supabase
          .from("project_percentage")
          .update({
            total_percentage: pp?.total_percentage + percentageAmount,
            period_percentage: pp?.period_percentage + percentageAmount,
          })
          .eq("project_id", expenseData.project_id)
          .eq("currency", expenseData.currency)
          .eq("type", expenseData.payment_method ?? "cash");

        if (UpdatePPError) throw UpdatePPError;
      }

      // counters (leave as you had)
      await supabase
        .from("projects")
        .update({
          expense_counter: (project?.expense_counter || 0) + 1,
          invoice_counter: (project?.invoice_counter || 0) + 1,
        })
        .eq("id", expenseData.project_id);

      await supabase
        .from("project_expenses")
        .update({ payment_counter: expense.payment_counter + 1 })
        .eq("id", expense.id);

      // update local state
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          project_expenses: [expense, ...(prev.project_expenses ?? [])],
        };
      });

      return { data: expense, error: null };
    } catch (err) {
      console.error("Error in addExpense", err);
      const error = err as PostgrestError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  const addExpensePercentage = async (
    expenseData: ProjectExpensePercentageFormValues,
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) throw new Error("User not authenticated");

      if (!expenseData.project_id) throw new Error("Project is required");
      if (!expenseData.total_amount || expenseData.total_amount <= 0)
        throw new Error("Total amount must be > 0");
      if (!expenseData.currency) throw new Error("Currency is required");
      if (!expenseData.type) throw new Error("Expense type is required");
      if (!expenseData.phase) throw new Error("Phase is required");

      const paidAmount = expenseData.paid_amount ?? 0;

      if (paidAmount > 0 && !expenseData.payment_method) {
        throw new Error("payment_method is required when paid_amount > 0");
      }

      if (
        expenseData.percentage &&
        (expenseData.percentage < 0 || expenseData.percentage > 100)
      ) {
        throw new Error("Percentage must be between 0 and 100");
      }

      // ✅ Get percentage rate (do NOT depend on payment_method if it's global)
      const { data: pp, error: ppError } = await supabase
        .from("project_percentage")
        .select("total_percentage, period_percentage")
        .eq("project_id", expenseData.project_id)
        .eq("currency", expenseData.currency)
        .eq("type", expenseData.payment_method ?? "cash")
        .maybeSingle();

      if (ppError || !pp) {
        console.error("Error fetching project percentage", ppError);
        throw ppError || new Error("Project percentage not found");
      }

      const rate = (expenseData.percentage ?? 0) / 100;

      let status: "unpaid" | "paid" | "partially_paid";
      if (paidAmount === 0) status = "unpaid";
      else if (paidAmount === expenseData.total_amount) status = "paid";
      else status = "partially_paid";

      // 1) Insert expense invoice
      const { data: expense, error: expenseErr } = await supabase
        .from("project_expenses")
        .insert({
          project_id: expenseData.project_id,
          description: expenseData.description,
          total_amount: expenseData.total_amount,
          expense_date: expenseData.date,
          created_by: user.id,
          phase: expenseData.phase,
          expense_type: expenseData.type,
          status,
          amount_paid: paidAmount,
          serial_number: project?.expense_counter || 0,
          contractor_id: expenseData.contractor_id ?? undefined,
          vendor_id: expenseData.vendor_id ?? undefined,
          currency: expenseData.currency,
          is_percentage: true,
        })
        .select()
        .single();

      if (expenseErr) throw expenseErr;

      // ✅ 2) Update project_balances (invoice-based net)
      const invoicePercentage = expenseData.total_amount * rate;
      const netDelta = expenseData.total_amount + invoicePercentage;

      const { data: balanceData, error: balanceError } = await supabase
        .from("project_balances")
        .select("*")
        .eq("project_id", expenseData.project_id)
        .eq("currency", expenseData.currency)
        .single();

      if (balanceError) throw balanceError;

      const { error: balanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: (balanceData?.balance || 0) - netDelta,
          total_expense:
            (balanceData?.total_expense || 0) + expenseData.total_amount,
          total_percentage:
            (balanceData?.total_percentage || 0) + invoicePercentage,
        })
        .eq("id", balanceData?.id);

      if (balanceUpdateError) throw balanceUpdateError;

      // 3) If paid > 0, insert payment + percentage log + update account
      if (paidAmount > 0) {
        const paymentMethod = expenseData.payment_method; // safe now

        const serial_number = Number(
          `${project?.expense_counter}.${expense.payment_counter}`,
        );

        // fetch account
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("owner_id", expenseData.project_id)
          .eq("owner_type", "project")
          .eq("type", expenseData.payment_method ?? "cash")
          .eq("currency", expenseData.currency)
          .single();

        if (accountError || !accountData) {
          console.error("Error fetching project account", accountError);
          throw accountError || new Error("Project account not found");
        }

        const { data: expensePayment, error: paymentError } = await supabase
          .from("expense_payments")
          .insert({
            expense_id: expense.id,
            amount: paidAmount,
            payment_method: paymentMethod,
            account_id: accountData.id,
            created_by: user.id,
            serial_number,
            expense_no: expense.serial_number,
            payment_no: expense.payment_counter,
            invoice_no: project?.invoice_counter,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        const percentageAmount = paidAmount * rate;

        const { error: logError } = await supabase
          .from("project_percentage_logs")
          .insert({
            project_id: expenseData.project_id,
            expense_id: expense.id,
            payment_id: expensePayment.id,
            amount: percentageAmount,
            percentage: expenseData.percentage ?? 0,
          });

        if (logError) throw logError;

        const accountTotal = paidAmount + percentageAmount;

        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({
            balance: accountData.balance - accountTotal,
            total_expense: accountData.total_expense + paidAmount,
            total_percentage: accountData.total_percentage + percentageAmount,
          })
          .eq("id", accountData.id);

        if (accountUpdateError) throw accountUpdateError;

        // Optional: if project_percentage totals are meant to track PAID percentage (cash basis)
        // keep this update; otherwise remove it.
        const { error: UpdatePPError } = await supabase
          .from("project_percentage")
          .update({
            total_percentage: pp?.total_percentage + percentageAmount,
            period_percentage: pp?.period_percentage + percentageAmount,
          })
          .eq("project_id", expenseData.project_id)
          .eq("currency", expenseData.currency)
          .eq("type", expenseData.payment_method ?? "cash");

        if (UpdatePPError) throw UpdatePPError;
      }

      // counters (leave as you had)
      await supabase
        .from("projects")
        .update({
          expense_counter: (project?.expense_counter || 0) + 1,
          invoice_counter: (project?.invoice_counter || 0) + 1,
        })
        .eq("id", expenseData.project_id);

      await supabase
        .from("project_expenses")
        .update({ payment_counter: expense.payment_counter + 1 })
        .eq("id", expense.id);

      // update local state
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          project_expenses: [expense, ...(prev.project_expenses ?? [])],
        };
      });

      return { data: expense, error: null };
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
            incomeData.payment_method === "cash" ? "cash" : "bank",
          serial_number: projectRow?.income_counter || 0,
          client_name: incomeData.client_name,
          currency: incomeData.currency,
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
          invoice_counter: (projectRow?.income_counter || 0) + 1,
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
      .select("refund_counter, invoice_counter")
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
      invoice_number: companyData?.invoice_counter || 0,
      currency: form.currency,
      expense_id: form.expense_id ?? null,
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
    const rate = (projectPercentage?.percentage || 0) / 100;
    const percentageAmount = form.amount * rate;
    const totalAmount = form.amount + percentageAmount;

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
        balance: projectAccount.balance + totalAmount,
        refund: (projectAccount.refund || 0) + totalAmount,
        total_percentage:
          (projectAccount.total_percentage || 0) - percentageAmount,
        total_expense: (projectAccount.total_expense || 0) - form.amount,
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
        balance: projectBalance.balance + totalAmount,
        total_expense: projectBalance.total_expense - form.amount,
        refund: (projectBalance.refund || 0) + totalAmount,
        total_percentage:
          (projectBalance.total_percentage || 0) - percentageAmount,
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
        invoice_counter: (companyData?.invoice_counter || 0) + 1,
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
    addExpensePercentage,
  };
}

export function useProjectExpenseActions() {
  const { user } = useAuth();

  const updateExpense = async (payload: {
    expense_id: string;
    description?: string | null;
    total_amount?: number | null;
    expense_date?: string | null; // yyyy-mm-dd
    expense_type: ExpenseType;
    phase: Phase;
    currency: Currency;
    contractor_id?: string | null;
    expense_ref_id?: string | null;
    vendor_id?: string | null;
  }) => {
    if (!user?.id) return { success: false, error: "غير مصرح" };

    const { data, error } = await supabase
      .from("project_expenses")
      .select("*")
      .eq("id", payload.expense_id)
      .single();

    if (error || !data) {
      console.error("Error fetching expense for update", error);
      return { success: false, error: "حدث خطأ أثناء جلب المصروف للتحديث" };
    }

    if (!data.currency) {
      return {
        success: false,
        error: "عملة المصروف غير موجودة (currency is null)",
      };
    }

    // ✅ normalize undefined so it doesn't look like a change
    const nextVendor = payload.vendor_id ?? data.vendor_id ?? null;
    const nextContractor = payload.contractor_id ?? data.contractor_id ?? null;
    const nextDescription = payload.description ?? data.description ?? null;
    const nextDate = payload.expense_date ?? data.expense_date ?? null;
    const nextExpenseRef = payload.expense_ref_id ?? data.expense_id ?? null;

    // compaier if the change is none money values
    const changedVendor = nextVendor !== (data.vendor_id ?? null);
    const changedContractor = nextContractor !== (data.contractor_id ?? null);
    const changedDescription = nextDescription !== (data.description ?? null);
    const changedDate = nextDate !== (data.expense_date ?? null);
    const changedType = payload.expense_type !== data.expense_type;
    const changedPhase = payload.phase !== data.phase;

    // ✅ normalize amount so undefined doesn't force change
    const nextTotalAmount = payload.total_amount ?? data.total_amount;
    const changedAmount = nextTotalAmount !== data.total_amount;

    const changedCurrency = payload.currency !== data.currency;
    if (changedCurrency) {
      return {
        success: false,
        error:
          "لا يمكن تغيير عملة المصروف، يرجى حذف المصروف وإعادة إضافته بالعملة الصحيحة",
      };
    }

    // ✅ prevent total < paid (basic safety)
    const paid = data.amount_paid ?? 0;

    if (
      changedVendor ||
      changedContractor ||
      changedDescription ||
      changedDate ||
      changedType ||
      changedPhase ||
      nextExpenseRef !== (data.expense_id ?? null)
    ) {
      //update the expense
      const { error: updateError } = await supabase
        .from("project_expenses")
        .update({
          description: nextDescription,
          expense_date: nextDate,
          expense_type: payload.expense_type,
          phase: payload.phase,
          contractor_id: nextContractor,
          vendor_id: nextVendor,
          expense_id: nextExpenseRef,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.expense_id);

      if (updateError) {
        console.error("Error updating expense", updateError);
        return { success: false, error: "حدث خطأ أثناء تحديث المصروف" };
      }
    }

    if (changedAmount) {
      // update the amount + ✅ update status (basic)
      let status: "unpaid" | "paid" | "partially_paid";
      if (paid === 0) status = "unpaid";
      else if (paid >= nextTotalAmount) status = "paid";
      else status = "partially_paid";

      const { error: amountUpdateError } = await supabase
        .from("project_expenses")
        .update({
          total_amount: nextTotalAmount,
          status,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.expense_id);

      if (amountUpdateError) {
        console.error("Error updating expense amount", amountUpdateError);
        return { success: false, error: "حدث خطأ أثناء تحديث مبلغ المصروف" };
      }

      //update the account balance based on the difference between the new amount and the old amount
      const amountDifference = nextTotalAmount - data.total_amount;

      const { data: projectBalance, error: projectBalanceError } =
        await supabase
          .from("project_balances")
          .select("*")
          .eq("project_id", data.project_id)
          .eq("currency", data.currency)
          .single();

      if (projectBalanceError || !projectBalance) {
        console.error(
          "Error fetching project balance for expense amount update",
          projectBalanceError,
        );
        return {
          success: false,
          error: "حدث خطأ أثناء جلب رصيد المشروع لتحديث مبلغ المصروف",
        };
      }

      const { data: PercentageData, error: PercentageError } = await supabase
        .from("project_percentage")
        .select("percentage")
        .eq("project_id", data.project_id)
        .eq("currency", data.currency);

      if (PercentageError || !PercentageData) {
        console.error(
          "Error fetching project percentage for expense amount update",
          PercentageError,
        );
        return {
          success: false,
          error: "حدث خطأ أثناء جلب نسبة المشروع لتحديث مبلغ المصروف",
        };
      }

      const rate = PercentageData[0]?.percentage / 100;
      const golableDifference = amountDifference + amountDifference * rate;

      const { error: projectBalanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: projectBalance.balance - golableDifference,
          total_expense: projectBalance.total_expense + amountDifference,
          total_percentage:
            projectBalance.total_percentage + amountDifference * rate,
        })
        .eq("id", projectBalance.id);

      if (projectBalanceUpdateError) {
        console.error(
          "Error updating project balance for expense amount update",
          projectBalanceUpdateError,
        );
        return {
          success: false,
          error: "حدث خطأ أثناء تحديث رصيد المشروع لتحديث مبلغ المصروف",
        };
      }
    }

    return { success: true };
  };

  const deleteExpense = async (payload: {
    expense_id: string;
    currency: Currency; // currency_type
  }) => {
    if (!user?.id) {
      console.log("Delete expense failed: User not authenticated");
      return { success: false, error: "غير مصرح" };
    }

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
