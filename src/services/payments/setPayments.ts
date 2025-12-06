import { supabase } from "../../lib/supabaseClient";

interface ProcessExpensePaymentParams {
  expense_id: string;
  project_id: string;
  amount: number;
  currency: "LYD" | "USD" | "EUR";
  payment_method: "cash" | "bank";
  created_by: string;
}
export async function processExpensePayment(
  params: ProcessExpensePaymentParams
) {
  const {
    expense_id,
    project_id,
    amount,
    currency,
    payment_method,
    created_by,
  } = params;
  if (!expense_id || !project_id || !amount || !currency) {
    console.error("Missing required parameters for processing expense payment");
    return { success: false, error: "معلمات مفقودة لمعالجة دفع المصروفات" };
  }

  // 1) fetch expense and lock it
  const { data: expense, error: expenseError } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("id", expense_id)
    .single();

  if (expenseError || !expense) {
    console.error("Error fetching expense:", expenseError);
    return { success: false, error: "خطأ في جلب المصروف" };
  }

  // 2) fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .single();

  if (projectError || !project) {
    console.error("Error fetching project:", projectError);
    return { success: false, error: "خطأ في جلب المشروع" };
  }

  // 3) determine account type
  const accountType = payment_method === "cash" ? "cash" : "bank";

  // 4) find account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("owner_id", project.id)
    .eq("owner_type", "project")
    .eq("currency", currency)
    .eq("type", accountType)
    .single();

  if (accountError || !account) {
    console.error("Error fetching account:", accountError);
    return { success: false, error: "خطأ في جلب الحساب" };
  }

  // 4.1) fetch project_balance
  const { data: projectBalance, error: projectBalanceError } = await supabase
    .from("project_balances")
    .select("*")
    .eq("project_id", project.id)
    .eq("currency", currency as string)
    .single();

  if (projectBalanceError || !projectBalance) {
    console.error("Error fetching project balance:", projectBalanceError);
    return { success: false, error: "خطأ في جلب رصيد المشروع" };
  }

  // 4.2) fetch active project_percentage
  const { data: projectPercentage, error: projectPercentageError } =
    await supabase
      .from("project_percentage")
      .select("*")
      .eq("project_id", project.id)
      .eq("currency", currency)
      .eq("type", accountType)
      .single();

  if (projectPercentageError || !projectPercentage) {
    console.error("Error fetching project percentage:", projectPercentageError);
    return { success: false, error: "خطأ في جلب نسبة المشروع" };
  }

  // 5 insert expense payment record
  const { data: payment, error: insertError } = await supabase
    .from("expense_payments")
    .insert({
      expense_id,
      amount,
      payment_method,
      account_id: account.id,
      created_by,
      serial_number: expense.serial_number,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting expense payment:", insertError);
    return { success: false, error: "خطأ في تسجيل دفع المصروف" };
  }

  // 6 total deductions
  const company_fee = amount * (projectPercentage.percentage / 100);
  const total_cost = amount + company_fee;

  // 7) update account balance
  const { error: updateAccountError } = await supabase
    .from("accounts")
    .update({
      balance: (account.balance || 0) - total_cost,
    })
    .eq("id", account.id);

  if (updateAccountError) {
    console.error("Error updating account balance:", updateAccountError);
    return { success: false, error: "خطأ في تحديث رصيد الحساب" };
  }

  //update project balance
  const { error: updateProjectBalanceError } = await supabase
    .from("project_balances")
    .update({
      balance: (projectBalance.balance || 0) - total_cost,
      held: (projectBalance.held || 0) - amount,
    })
    .eq("id", projectBalance.id);

  if (updateProjectBalanceError) {
    console.error("Error updating project balance:", updateProjectBalanceError);
    return { success: false, error: "خطأ في تحديث الأرصدة" };
  }

  // update project percentage
  const { error: updateProjectPercentageError } = await supabase
    .from("project_percentage")
    .update({
      period_percentage:
        (projectPercentage.period_percentage || 0) + company_fee,
      total_percentage: (projectPercentage.total_percentage || 0) + company_fee,
    })
    .eq("id", projectPercentage.id);

  if (updateProjectPercentageError) {
    console.error(
      "Error updating project percentage:",
      updateProjectPercentageError
    );
    return { success: false, error: "خطأ في تحديث نسبة المشروع" };
  }

  // insert percentage log
  const { error: insertLogError } = await supabase
    .from("project_percentage_logs")
    .insert({
      amount: company_fee,
      percentage: projectPercentage.percentage,
      project_id: project.id,
      expense_id: expense_id,
      payment_id: payment.id,
    });

  if (insertLogError) {
    console.error("Error inserting project percentage log:", insertLogError);
    return { success: false, error: "خطأ في تسجيل نسبة المشروع" };
  }

  // update expense status if fully paid
  const totalPaid = expense.amount_paid + amount;
  const status = totalPaid === expense.total_amount ? "paid" : "partially_paid";
  const { data: updatedExpense, error: totalPaymentsError } = await supabase
    .from("project_expenses")
    .update({
      amount_paid: totalPaid,
      status: status,
      payment_counter: (expense.payment_counter || 0) + 1,
    })
    .eq("id", expense.id)
    .select()
    .single();

  if (totalPaymentsError) {
    console.error("Error updating expense after payment:", totalPaymentsError);
    return { success: false, error: "خطأ في تحديث المصروف بعد الدفع" };
  }

  return { success: true, data: updatedExpense };
}
