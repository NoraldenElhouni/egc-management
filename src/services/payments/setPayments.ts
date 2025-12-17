import { supabase } from "../../lib/supabaseClient";
import { ExpensePayments } from "../../types/global.type";

interface ProcessExpensePaymentParams {
  expense_id: string;
  project_id: string;
  amount: number;
  currency: "LYD" | "USD" | "EUR";
  payment_method: "cash" | "bank";
  created_by: string;
}

interface AcceptContractPaymentProps {
  payment_id: string;
  approved_by: string;
  payment_method: "cash" | "bank";
  currency: "LYD" | "USD" | "EUR";
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

  // 4.2) fetch active project_percentage (use limit(1).maybeSingle() to avoid PGRST116 when duplicates exist)
  const { data: projectPercentage, error: projectPercentageError } =
    await supabase
      .from("project_percentage")
      .select("*")
      .eq("project_id", project.id)
      .eq("currency", currency)
      .eq("type", accountType)
      .limit(1)
      .maybeSingle();

  if (projectPercentageError) {
    console.error("Error fetching project percentage:", projectPercentageError);
    return { success: false, error: "خطأ في جلب نسبة المشروع" };
  }
  if (!projectPercentage) {
    console.error("No project_percentage row found for project/currency/type");
    return { success: false, error: "خطأ: لا توجد نسبة مشروع مفعّلة" };
  }

  const expenseNo = Number(expense.serial_number || 0);
  const paymentNo = Number(expense.payment_counter || 1);
  const invoiceNo = Number(project.invoice_counter || 1);

  // 5 insert expense payment record
  const { data: payment, error: insertError } = await supabase
    .from("expense_payments")
    .insert({
      expense_id,
      amount,
      payment_method,
      account_id: account.id,
      created_by,
      invoice_no: invoiceNo,
      payment_no: paymentNo,
      expense_no: expenseNo,
      // i want it to be like 5.1 , 5.2 etc
      serial_number: parseFloat(`${expenseNo}.${paymentNo}`),
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

  // invoice_counter
  const { error: updateProjectError } = await supabase
    .from("projects")
    .update({
      invoice_counter: invoiceNo + 1,
    })
    .eq("id", project.id);

  if (updateProjectError) {
    console.error(
      "Error updating project expense counter:",
      updateProjectError
    );
    return { success: false, error: "خطأ في تحديث عداد المصروفات" };
  }

  return { success: true, data: updatedExpense };
}

export async function acceptContractPayment(
  params: AcceptContractPaymentProps
) {
  const { payment_id, approved_by, payment_method, currency } = params;

  // 1) fetch contract_payment
  const { data: contractPayment, error: contractPaymentError } = await supabase
    .from("contract_payments")
    .select("*")
    .eq("id", payment_id)
    .single();

  if (contractPaymentError || !contractPayment) {
    console.error("Error fetching contract payment:", contractPaymentError);
    return { success: false, error: "خطأ في جلب دفع العقد" };
  }
  // 2) fetch contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractPayment.contract_id)
    .single();

  if (contractError || !contract) {
    console.error("Error fetching contract:", contractError);
    return { success: false, error: "خطأ في جلب العقد" };
  }

  // 3) fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", contract.project_id)
    .single();

  if (projectError || !project) {
    console.error("Error fetching project:", projectError);
    return { success: false, error: "خطأ في جلب المشروع" };
  }

  // 4) determine account type
  const accountType = payment_method === "cash" ? "cash" : "bank";

  // 5) find and lock account
  const { data: projectaAccount, error: projectAccountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("owner_id", project.id)
    .eq("type", accountType)
    .single();

  if (projectAccountError || !projectaAccount) {
    console.error("Error fetching account:", projectAccountError);
    return { success: false, error: "خطأ في جلب الحساب" };
  }

  // 6) ensure account has enough balance
  if ((projectaAccount.balance || 0) < contractPayment.amount) {
    console.error("Insufficient account balance to accept payment");
    return { success: false, error: "رصيد الحساب غير كافٍ لقبول الدفع" };
  }

  // 7) fetch project_balance
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

  // 8) fetch active project_percentage (use limit(1).maybeSingle() to avoid PGRST116 when duplicates exist)
  const { data: projectPercentage, error: projectPercentageError } =
    await supabase
      .from("project_percentage")
      .select("*")
      .eq("project_id", project.id)
      .eq("currency", currency)
      .eq("type", accountType)
      .limit(1)
      .maybeSingle();

  if (projectPercentageError) {
    console.error("Error fetching project percentage:", projectPercentageError);
    return { success: false, error: "خطأ في جلب نسبة المشروع" };
  }
  if (!projectPercentage) {
    console.error("No project_percentage row found for project/currency/type");
    return { success: false, error: "خطأ: لا توجد نسبة مشروع مفعّلة" };
  }

  // 9) approve contract_payment
  const { error: approveError } = await supabase
    .from("contract_payments")
    .update({
      status: "approved",
      approved_by,
      payment_method,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment_id);

  if (approveError) {
    console.error("Error approving contract payment:", approveError);
    return { success: false, error: "خطأ في الموافقة على دفع العقد" };
  }

  // 10) if expense exists, fetch & update
  const { data: expenseData, error: expenseError } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("contract_id", payment_id)
    .single();

  if ((expenseError && expenseError.code !== "PGRST116") || !expenseData) {
    console.error("Error fetching associated expense:", expenseError);
    return { success: false, error: "خطأ في جلب المصروف المرتبط" };
  }

  // 12) insert expense_payment
  const { data: payment, error: insertPaymentError } = await supabase
    .from("expense_payments")
    .insert({
      amount: contractPayment.amount,
      expense_id: expenseData?.id,
      created_by: approved_by,
      payment_method: payment_method,
      account_id: projectaAccount.id,
      payment_no: expenseData?.payment_counter,
      expense_no: expenseData?.serial_number,
      // i want it to be like 5.1 , 5.2 etc
      serial_number: parseFloat(
        `${expenseData?.serial_number}.${expenseData?.payment_counter || 0}`
      ),
    } as ExpensePayments)
    .select()
    .single();

  if (insertPaymentError || !payment) {
    console.error("Error inserting expense payment:", insertPaymentError);
    return { success: false, error: "خطأ في تسجيل دفع المصروف" };
  }

  // increment payment_counter
  if (expenseData) {
    const totalPaid = expenseData.amount_paid + contractPayment.amount;
    const status =
      totalPaid === expenseData.total_amount ? "paid" : "partially_paid";
    const { error: updateExpenseError } = await supabase
      .from("project_expenses")
      .update({
        amount_paid: totalPaid,
        status: status,
        payment_counter: (expenseData.payment_counter || 0) + 1,
      })
      .eq("id", expenseData.id);
    if (updateExpenseError) {
      console.error("Error updating associated expense:", updateExpenseError);
      return { success: false, error: "خطأ في تحديث المصروف المرتبط" };
    }
  }

  // 13) insert into project_percentage_logs
  const company_fee =
    contractPayment.amount * (projectPercentage.percentage / 100);
  const total_cost = contractPayment.amount + company_fee;

  const { error: insertLogError } = await supabase
    .from("project_percentage_logs")
    .insert({
      amount: company_fee,
      expense_id: expenseData?.id,
      payment_id: payment.id,
      percentage: projectPercentage.percentage,
      project_id: project.id,
      created_at: new Date().toISOString(),
    });

  if (insertLogError) {
    console.error("Error inserting project percentage log:", insertLogError);
    return { success: false, error: "خطأ في تسجيل سجل نسبة المشروع" };
  }

  // 14) update account balance
  const { error: updateAccountError } = await supabase
    .from("accounts")
    .update({
      balance: (projectaAccount.balance || 0) - total_cost,
    })
    .eq("id", projectaAccount.id);

  if (updateAccountError) {
    console.error("Error updating account balance:", updateAccountError);
    return { success: false, error: "خطأ في تحديث رصيد الحساب" };
  }
  // 15) update project_balance
  const { error: updateProjectBalanceError } = await supabase
    .from("project_balances")
    .update({
      balance: (projectBalance.balance || 0) - total_cost,
      held: (projectBalance.held || 0) - contractPayment.amount,
    })
    .eq("id", projectBalance.id);

  if (updateProjectBalanceError) {
    console.error("Error updating project balance:", updateProjectBalanceError);
    return { success: false, error: "خطأ في تحديث رصيد المشروع" };
  }

  // 16) update project_percentage totals
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

  return { success: true };
}
