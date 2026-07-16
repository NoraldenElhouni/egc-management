import { supabase } from "../../lib/supabaseClient";
import { DistributionPeriod } from "./useDistributionHistory";

export interface PeriodEditRow {
  id: string; // existing item id, or "new-<employeeId>" for a newly added row
  type: "bank" | "company" | "employee";
  employeeId?: string;
  label: string;
  percentage: number;
  amount: number; // display-only, recomputed from percentage
}

async function adjustEmployeeAccount(
  employeeId: string,
  isBank: boolean,
  delta: number,
) {
  if (delta === 0) return;
  const { data: acc, error } = await supabase
    .from("employee_account")
    .select("cash_balance, bank_balance")
    .eq("id", employeeId)
    .single();
  if (error || !acc) throw error ?? new Error(`لم يتم العثور على حساب الموظف`);

  const field = isBank ? "bank_balance" : "cash_balance";
  const { error: updErr } = await supabase
    .from("employee_account")
    .update({
      [field]: Math.max(0, Number(acc[field as keyof typeof acc]) + delta),
    })
    .eq("id", employeeId);
  if (updErr) throw updErr;
}

async function adjustCompanyAccount(
  type: "main" | "bank",
  isBank: boolean,
  delta: number,
) {
  if (delta === 0) return;
  const { data: acc, error } = await supabase
    .from("company_account")
    .select("id, cash_balance, bank_balance")
    .eq("type", type)
    .eq("status", "active")
    .single();
  if (error || !acc) throw error ?? new Error("لم يتم العثور على حساب الشركة");

  const field = isBank ? "bank_balance" : "cash_balance";
  const { error: updErr } = await supabase
    .from("company_account")
    .update({
      [field]: Math.max(0, Number(acc[field as keyof typeof acc]) + delta),
    })
    .eq("id", acc.id);
  if (updErr) throw updErr;
}

async function adjustPayroll(
  employeeId: string,
  payDate: string,
  delta: number,
) {
  if (delta === 0) return;
  const { data: existing, error: findErr } = await supabase
    .from("payroll")
    .select("id, percentage_salary, total_salary")
    .eq("employee_id", employeeId)
    .eq("pay_date", payDate)
    .eq("status", "pending")
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { error } = await supabase
      .from("payroll")
      .update({
        percentage_salary: Math.max(
          0,
          Number(existing.percentage_salary ?? 0) + delta,
        ),
        total_salary: Math.max(0, Number(existing.total_salary ?? 0) + delta),
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else if (delta > 0) {
    const { error } = await supabase.from("payroll").insert({
      employee_id: employeeId,
      pay_date: payDate,
      percentage_salary: delta,
      total_salary: delta,
      status: "pending",
    });
    if (error) throw error;
  }
  // delta < 0 with no pending row → already approved/paid, nothing safe to touch
}

export async function savePeriodGroupDistribution(
  periods: DistributionPeriod[],
  rows: PeriodEditRow[],
): Promise<{ success: boolean; error?: string }> {
  const roundedSum =
    Math.round(
      rows.reduce((s, r) => s + (Number(r.percentage) || 0), 0) * 100,
    ) / 100;
  if (roundedSum !== 100) {
    return { success: false, error: "مجموع النسب يجب أن يساوي 100%" };
  }

  const bankRow = rows.find((r) => r.type === "bank");
  const companyRow = rows.find((r) => r.type === "company");
  const employeeRows = rows.filter(
    (r) => r.type === "employee" && r.employeeId,
  );

  try {
    // Apply the same percentage split to every period in the group
    // (cash period, bank period) — each keeps its own total_amount.
    for (const period of periods) {
      const isBank = period.type === "bank";
      const totalAmount = Number(period.total_amount);

      const oldBankItem = period.items.find((i) => i.item_type === "bank");
      const oldCompanyItem = period.items.find(
        (i) => i.item_type === "company",
      );
      const oldEmployeeItems = period.items.filter(
        (i) => i.item_type === "employee",
      );

      if (bankRow && oldBankItem) {
        const newAmount = Number(
          ((bankRow.percentage / 100) * totalAmount).toFixed(2),
        );
        await adjustCompanyAccount(
          "bank",
          isBank,
          newAmount - Number(oldBankItem.total),
        );
        const { error } = await supabase
          .from("project_percentage_period_items")
          .update({
            percentage: bankRow.percentage,
            cash_amount: isBank ? 0 : newAmount,
            bank_amount: isBank ? newAmount : 0,
            total: newAmount,
          })
          .eq("id", oldBankItem.id);
        if (error) throw error;
      }

      if (companyRow && oldCompanyItem) {
        const newAmount = Number(
          ((companyRow.percentage / 100) * totalAmount).toFixed(2),
        );
        await adjustCompanyAccount(
          "main",
          isBank,
          newAmount - Number(oldCompanyItem.total),
        );
        const { error } = await supabase
          .from("project_percentage_period_items")
          .update({
            percentage: companyRow.percentage,
            cash_amount: isBank ? 0 : newAmount,
            bank_amount: isBank ? newAmount : 0,
            total: newAmount,
          })
          .eq("id", oldCompanyItem.id);
        if (error) throw error;
      }

      for (const row of employeeRows) {
        const newAmount = Number(
          ((row.percentage / 100) * totalAmount).toFixed(2),
        );
        const oldItem = oldEmployeeItems.find(
          (i) => i.user_id === row.employeeId,
        );

        if (oldItem) {
          const delta = newAmount - Number(oldItem.total);
          await adjustEmployeeAccount(row.employeeId!, isBank, delta);
          await adjustPayroll(row.employeeId!, period.end_date, delta);
          const { error } = await supabase
            .from("project_percentage_period_items")
            .update({
              percentage: row.percentage,
              cash_amount: isBank ? 0 : newAmount,
              bank_amount: isBank ? newAmount : 0,
              total: newAmount,
            })
            .eq("id", oldItem.id);
          if (error) throw error;
        } else {
          await adjustEmployeeAccount(row.employeeId!, isBank, newAmount);
          await adjustPayroll(row.employeeId!, period.end_date, newAmount);
          const { error } = await supabase
            .from("project_percentage_period_items")
            .insert({
              period_id: period.id,
              item_type: "employee",
              user_id: row.employeeId,
              percentage: row.percentage,
              cash_amount: isBank ? 0 : newAmount,
              bank_amount: isBank ? newAmount : 0,
              cash_held: 0,
              bank_held: 0,
              discount: 0,
              total: newAmount,
            });
          if (error) throw error;
        }
      }

      const keptIds = new Set(employeeRows.map((r) => r.employeeId));
      const removedItems = oldEmployeeItems.filter(
        (i) => i.user_id && !keptIds.has(i.user_id),
      );
      for (const item of removedItems) {
        await adjustEmployeeAccount(item.user_id!, isBank, -Number(item.total));
        await adjustPayroll(
          item.user_id!,
          period.end_date,
          -Number(item.total),
        );
        const { error } = await supabase
          .from("project_percentage_period_items")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      }

      const { error: periodErr } = await supabase
        .from("project_percentage_periods")
        .update({
          bank_percentage: bankRow?.percentage ?? period.bank_percentage,
          company_percentage:
            companyRow?.percentage ?? period.company_percentage,
        })
        .eq("id", period.id);
      if (periodErr) throw periodErr;
    }

    return { success: true };
  } catch (err) {
    console.error("Period group edit error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
    };
  }
}
