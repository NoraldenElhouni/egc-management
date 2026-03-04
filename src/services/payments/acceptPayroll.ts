import { supabase } from "../../lib/supabaseClient";

type AcceptPayrollResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Accept a payroll payment — finance gives the employee cash and/or bank transfer.
 *
 * Flow:
 *   - During distribution: employee_account balances were credited (went UP)
 *   - When accepted here:  employee_account balances are debited (go DOWN)
 *     because the money has left the account and been handed to the employee
 *
 * DB requirement:
 *   ALTER TABLE public.payroll
 *     ADD COLUMN cash_amount numeric NOT NULL DEFAULT 0,
 *     ADD COLUMN bank_amount numeric NOT NULL DEFAULT 0;
 */
export async function acceptPayrollPayment(
  payrollId: string,
  approvedBy: string,
  cashAmount: number,
  bankAmount: number,
): Promise<AcceptPayrollResult> {
  try {
    const total = cashAmount + bankAmount;

    // 1. Fetch payroll record
    const { data: payroll, error: fetchError } = await supabase
      .from("payroll")
      .select("id, employee_id, total_salary, status")
      .eq("id", payrollId)
      .single();

    if (fetchError || !payroll) {
      return {
        success: false,
        error: fetchError?.message ?? "Payroll not found",
      };
    }

    if (payroll.status === "accepted") {
      return { success: false, error: "تم قبول هذا الراتب مسبقاً" };
    }

    // 2. Validate amounts match total_salary
    if (Math.abs(total - Number(payroll.total_salary)) > 0.01) {
      return {
        success: false,
        error: `مجموع المبالغ (${total}) لا يساوي إجمالي الراتب (${payroll.total_salary})`,
      };
    }

    // 3. Fetch employee account
    const { data: empAccount, error: accountError } = await supabase
      .from("employee_account")
      .select("id, cash_balance, bank_balance")
      .eq("id", payroll.employee_id)
      .single();

    if (accountError || !empAccount) {
      return {
        success: false,
        error: accountError?.message ?? "Employee account not found",
      };
    }

    // 4. Debit employee_account — money leaves the account and goes to employee
    if (cashAmount > 0) {
      const { error } = await supabase
        .from("employee_account")
        .update({ cash_balance: Number(empAccount.cash_balance) - cashAmount })
        .eq("id", payroll.employee_id);
      if (error) return { success: false, error: error.message };
    }

    if (bankAmount > 0) {
      // Re-fetch to get latest bank_balance in case cash update just ran
      const { data: latest } = await supabase
        .from("employee_account")
        .select("bank_balance")
        .eq("id", payroll.employee_id)
        .single();

      const { error } = await supabase
        .from("employee_account")
        .update({
          bank_balance:
            Number(latest?.bank_balance ?? empAccount.bank_balance) -
            bankAmount,
        })
        .eq("id", payroll.employee_id);
      if (error) return { success: false, error: error.message };
    }

    // 5. Mark payroll as accepted and record the split
    const { error: updateError } = await supabase
      .from("payroll")
      .update({
        status: "accepted",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        cash_amount: cashAmount,
        bank_amount: bankAmount,
      })
      .eq("id", payrollId);

    if (updateError) return { success: false, error: updateError.message };

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error accepting payroll:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}
