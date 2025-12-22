import { supabase } from "../../lib/supabaseClient";

export async function acceptPayrollPayment(
  payrollPaymentId: string,
  approvedBy: string
) {
  try {
    // fetch payroll
    const { data: payrollData, error: fetchError } = await supabase
      .from("payroll")
      .select("*")
      .eq("id", payrollPaymentId)
      .single();

    if (fetchError) {
      console.error("Error fetching payroll data:", fetchError);
      return { success: false, error: fetchError.message };
    }

    // fethc emplyee account
    const { data: employeeAccountData, error: accountError } = await supabase
      .from("employee_account")
      .select("*")
      .eq("id", payrollData?.employee_id)
      .single();

    if (accountError) {
      console.error("Error fetching employee account data:", accountError);
      return { success: false, error: accountError.message };
    }

    //update employee account balance
    if (payrollData.payment_method === "bank") {
      //update the bank account balance
      const newBalance =
        (employeeAccountData?.bank_balance || 0) -
        (payrollData.total_salary || 0);
      const { error: updateBankError } = await supabase
        .from("employee_account")
        .update({ bank_balance: newBalance })
        .eq("employee_id", payrollData.employee_id);

      if (updateBankError) {
        console.error("Error updating bank balance:", updateBankError);
        return { success: false, error: updateBankError.message };
      }
    } else if (payrollData.payment_method === "cash") {
      //update the cash account balance
      const newBalance =
        (employeeAccountData?.cash_balance || 0) -
        (payrollData.total_salary || 0);
      const { error: updateCashError } = await supabase
        .from("employee_account")
        .update({ cash_balance: newBalance })
        .eq("id", payrollData.employee_id);

      if (updateCashError) {
        console.error("Error updating cash balance:", updateCashError);
        return { success: false, error: updateCashError.message };
      }
    }

    // Update payroll status to 'accepted'
    const { error } = await supabase
      .from("payroll")
      .update({
        status: "accepted",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq("id", payrollPaymentId)
      .single();

    if (error) {
      console.error("Error updating payroll status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error accepting payroll payment:", error);
  }
}
