import { supabase } from "../../lib/supabaseClient";
import { ExpensePaymentFormValues } from "../../types/schema/ProjectBook.schema";

interface AcceptContractPaymentProps {
  payment_id: string;
  approved_by: string;
  payment_method: "cash" | "bank";
  currency: "LYD" | "USD" | "EUR";
  expenseId: string;
}

interface AddPaymentResult {
  success: boolean;
  error?: string | null;
  data?: {
    account_id: string | null;
    amount: number;
    created_at: string;
    created_by: string | null;
    expense_id: string;
    expense_no: number | null;
    id: string;
    invoice_no: number | null;
    payment_method: "cash" | "bank" | null;
    payment_no: number | null;
    serial_number: number | null;
  }; // You can make this more specific based on your expense_payment table
}

type AddPaymentFunction = (
  form: ExpensePaymentFormValues,
) => Promise<AddPaymentResult>;

export async function acceptContractPayment(
  form: AcceptContractPaymentProps,
  addPayment: AddPaymentFunction,
) {
  const { payment_id, approved_by, payment_method, currency, expenseId } = form;

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

  // 4) fetch or verify expense exists
  const { data: expenseData, error: expenseError } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("contract_id", contract.id)
    .single();

  if (expenseError && expenseError.code !== "PGRST116") {
    console.error("Error fetching associated expense:", expenseError);
    return { success: false, error: "خطأ في جلب المصروف المرتبط" };
  }

  if (!expenseData) {
    console.error("No expense found for contract:", contract.id);
    return { success: false, error: "خطأ: لا يوجد مصروف مرتبط بهذا العقد" };
  }

  // 5) approve contract_payment
  const { error: approveError } = await supabase
    .from("contract_payments")
    .update({
      status: "approved",
      approved_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment_id);

  if (approveError) {
    console.error("Error approving contract payment:", approveError);
    return { success: false, error: "خطأ في الموافقة على دفع العقد" };
  }

  // 1) Get account (for method + currency)
  const { data: accountData, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_id", expenseData.project_id)
    .eq("currency", currency)
    .eq("type", payment_method)
    .single();

  if (accountError || !accountData) {
    console.error("Error fetching account data", accountError);
    return { success: false, error: "لا يمكن جلب بيانات الحساب" };
  }

  // 6) Process the expense payment using the centralized function
  const paymentResult = await addPayment({
    account_id: accountData.id,
    amount: contractPayment.amount,
    currency,
    expenseId,
  });

  if (!paymentResult.success) {
    console.error("Error processing expense payment:", paymentResult.error);
    // Rollback contract payment approval
    await supabase
      .from("contract_payments")
      .update({
        status: "pending",
        approved_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id);

    return { success: false, error: paymentResult.error };
  }

  return { success: true, data: paymentResult.data };
}
