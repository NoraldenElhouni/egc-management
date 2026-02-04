import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";
import { PercentageDistributionFormValues } from "../types/schema/PercentageDistribution.schema";
import {
  BankPeriodData,
  CashPeriodData,
  Employees,
  ExpensePayments,
  ProjectExpenses,
} from "../types/global.type";
import { FixedPayrollFormValues } from "../types/schema/fixedPayroll.schema";
import { MapsDistributionValues } from "../types/schema/MapsDistribution.schema";

export function usePayroll() {
  const [payroll, setPayroll] = useState<PayrollWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [fixedEmployees, setFixedEmployees] = useState<Employees[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await supabase.from("employees").select("id");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      }

      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`*, employees(first_name, last_name)`)
        .in("employee_id", data?.map((emp) => emp.id) || [])
        .eq("status", "pending");

      if (payrollError) {
        console.error("error fetching payroll", payrollError);
        setError(payrollError);
      } else {
        setPayroll(payrollData ?? []);
      }

      setLoading(false);
    }

    async function fetchFixedEmployees() {
      const { data, error } = await supabase.from("employees").select("*");

      if (error) {
        console.error("error fetching fixed employees", error);
        setError(error);
      }
      setFixedEmployees(data || []);
    }

    fetchEmployees();
    fetchFixedEmployees();
  }, []); // runs once on mount

  /**
   * PercentageDistribution
   * - Distributes project percentage amounts between company + employees
   * - Creates period records (bank/cash)
   * - Creates period items
   * - Records held + discounts
   * - Updates employee accounts + creates payroll entries
   * - Updates company accounts
   * - Resets project_percentage for next period
   *
   * NOTE (IMPORTANT):
   * This is still NOT a DB transaction. Best practice is to move this into a Postgres RPC
   * and wrap it in BEGIN/COMMIT to avoid partial writes.
   */

  const PercentageDistribution = async (
    form: PercentageDistributionFormValues,
  ) => {
    // helper: always date-only for Postgres "date" fields
    const today = () => new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // helper: consistent error logging
    const logErr = (label: string, error: unknown) => {
      console.error(`[PercentageDistribution] ${label}`, error);
    };

    // 0) Auth
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logErr("auth.getUser error", authError);
      return { success: false, message: "خطأ في التحقق من المستخدم" };
    }
    if (!userData?.user) {
      console.error("[PercentageDistribution] user not logged in");
      return { success: false, message: "المستخدم غير مسجل الدخول" };
    }
    const user = userData.user;

    // Guard: must have employees
    if (!form.employee?.length) {
      console.error("[PercentageDistribution] no employees in form");
      return { success: false, message: "لا يوجد موظفين للتوزيع" };
    }

    try {
      // 1) Fetch required data
      // 1.1 Company accounts
      const { data: companyAccounts, error: companyError } = await supabase
        .from("company_account")
        .select("*")
        .in("type", ["main", "discount", "held"])
        .eq("status", "active");

      if (companyError) {
        logErr("fetch company_account error", companyError);
        return { success: false, message: "خطأ في جلب بيانات حساب الشركة" };
      }
      if (!companyAccounts?.length) {
        console.error("[PercentageDistribution] company accounts not found");
        return { success: false, message: "لا توجد حسابات شركة" };
      }

      // 1.2 Employee accounts
      const employeeIds = form.employee.map((e) => e.employee_id);

      const { data: employeeAccounts, error: employeeAccountsError } =
        await supabase
          .from("employee_account")
          .select("*")
          .in("id", employeeIds);

      if (employeeAccountsError) {
        logErr("fetch employee_account error", employeeAccountsError);
        return { success: false, message: "خطأ في جلب بيانات حسابات الموظفين" };
      }

      // Ensure all employees have accounts
      const missingAccounts = employeeIds.filter(
        (id) => !employeeAccounts?.some((acc) => acc.id === id),
      );
      if (missingAccounts.length) {
        console.error(
          "[PercentageDistribution] missing employee accounts",
          missingAccounts,
        );
        return { success: false, message: "يوجد موظفين بدون حساب مالي" };
      }

      // 1.3 Project percentage data
      const { data: projectPercentRows, error: projectError } = await supabase
        .from("project_percentage")
        .select("*")
        .eq("project_id", form.project_id);

      if (projectError) {
        logErr("fetch project_percentage error", projectError);
        return { success: false, message: "خطأ في جلب بيانات نسبة المشروع" };
      }
      if (!projectPercentRows?.length) {
        console.error(
          "[PercentageDistribution] no project_percentage rows for project",
          form.project_id,
        );
        return { success: false, message: "لا توجد بيانات نسبة للمشروع" };
      }

      const bankPercentage = projectPercentRows.find((p) => p.type === "bank");
      const cashPercentage = projectPercentRows.find((p) => p.type === "cash");

      if (!bankPercentage && !cashPercentage) {
        console.error(
          "[PercentageDistribution] missing bank/cash percentages for project",
          form.project_id,
        );
        return {
          success: false,
          message: "لا توجد بيانات نسبة (بنك/نقدي) للمشروع",
        };
      }

      // 2) Create period(s)
      // IMPORTANT:
      // Your DB has: project_percentage_periods.type (USER-DEFINED). You are inserting "bank"/"cash".
      // Make sure enum/type includes those values.
      let bankPeriodData: BankPeriodData = null;
      let cashPeriodData: CashPeriodData = null;

      if (bankPercentage) {
        const { data: bankPeriod, error: bankPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            start_date: bankPercentage.period_start, // date
            end_date: today(), // date
            total_amount: bankPercentage.period_percentage, // confirm this is AMOUNT not %
            type: "bank",
          })
          .select()
          .single();

        if (bankPeriodError) {
          logErr("insert bank period error", bankPeriodError);
          return { success: false, message: "خطأ في تسجيل فترة البنك" };
        }
        bankPeriodData = bankPeriod;
      }

      if (cashPercentage) {
        const { data: cashPeriod, error: cashPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            start_date: cashPercentage.period_start, // date
            end_date: today(), // date
            total_amount: cashPercentage.period_percentage, // confirm this is AMOUNT not %
            type: "cash",
          })
          .select()
          .single();

        if (cashPeriodError) {
          logErr("insert cash period error", cashPeriodError);
          return { success: false, message: "خطأ في تسجيل فترة النقدي" };
        }
        cashPeriodData = cashPeriod;
      }

      // 3) Decide how to store items
      // If both bank + cash periods exist, we will create items for EACH period.
      // - bank period: use bank-related amounts, and set cash fields to 0
      // - cash period: use cash-related amounts, and set bank fields to 0
      // If only one exists: store both amounts in that one (keeps behavior simple).
      const periodsToUse = [bankPeriodData, cashPeriodData].filter(Boolean);

      if (!periodsToUse.length) {
        console.error("[PercentageDistribution] no period data created");
        return { success: false, message: "لا توجد بيانات فترة للمشروع" };
      }

      const createCompanyItem = async (
        periodId: string,
        mode: "bank" | "cash" | "both",
      ) => {
        const bank_amount = mode === "cash" ? 0 : form.company.BankAmount;
        const cash_amount = mode === "bank" ? 0 : form.company.CashAmount;

        const { error } = await supabase
          .from("project_percentage_period_items")
          .insert({
            period_id: periodId,
            bank_amount,
            cash_amount,
            discount: form.company.discount,
            total: form.company.total,
            bank_held: 0,
            cash_held: 0,
            percentage: form.company.percentage,
            item_type: "company",
            note: form.company.note || "",
            user_id: null,
          });

        if (error) {
          logErr(`insert company period item error (${mode})`, error);
          return { ok: false as const };
        }
        return { ok: true as const };
      };

      const createEmployeeItems = async (
        periodId: string,
        mode: "bank" | "cash" | "both",
      ) => {
        const rows = form.employee.map((emp) => {
          const bank_amount = mode === "cash" ? 0 : emp.BankAmount;
          const cash_amount = mode === "bank" ? 0 : emp.CashAmount;

          const bank_held = mode === "cash" ? 0 : emp.bank_held;
          const cash_held = mode === "bank" ? 0 : emp.cash_held;

          return {
            period_id: periodId,
            bank_amount,
            cash_amount,
            discount: emp.discount,
            total: emp.total,
            bank_held,
            cash_held,
            user_id: emp.employee_id,
            percentage: emp.percentage,
            item_type: "employee",
            note: emp.note || "",
          };
        });

        const { error } = await supabase
          .from("project_percentage_period_items")
          .insert(rows);

        if (error) {
          logErr(`insert employee period items error (${mode})`, error);
          return { ok: false as const };
        }
        return { ok: true as const };
      };

      // if both periods exist -> split by type. if only one -> "both"
      if (bankPeriodData && cashPeriodData) {
        // bank period
        {
          const r1 = await createCompanyItem(bankPeriodData.id, "bank");
          if (!r1.ok)
            return {
              success: false,
              message: "خطأ في تسجيل بند فترة الشركة (بنك)",
            };

          const r2 = await createEmployeeItems(bankPeriodData.id, "bank");
          if (!r2.ok)
            return {
              success: false,
              message: "خطأ في تسجيل بنود فترة الموظفين (بنك)",
            };
        }

        // cash period
        {
          const r1 = await createCompanyItem(cashPeriodData.id, "cash");
          if (!r1.ok)
            return {
              success: false,
              message: "خطأ في تسجيل بند فترة الشركة (نقدي)",
            };

          const r2 = await createEmployeeItems(cashPeriodData.id, "cash");
          if (!r2.ok)
            return {
              success: false,
              message: "خطأ في تسجيل بنود فترة الموظفين (نقدي)",
            };
        }
      } else {
        const onlyPeriod = periodsToUse[0];
        if (!onlyPeriod) {
          console.error("[PercentageDistribution] onlyPeriod not found");
          return { success: false, message: "فشل تحديد فترة للمشروع" };
        }

        const r1 = await createCompanyItem(onlyPeriod.id, "both");
        if (!r1.ok)
          return { success: false, message: "خطأ في تسجيل بند فترة الشركة" };

        const r2 = await createEmployeeItems(onlyPeriod.id, "both");
        if (!r2.ok)
          return { success: false, message: "خطأ في تسجيل بنود فترة الموظفين" };
      }

      // 4) Totals (for company accounts)
      const totalCashHeld = form.employee.reduce(
        (sum, emp) => sum + emp.cash_held,
        0,
      );
      const totalBankHeld = form.employee.reduce(
        (sum, emp) => sum + emp.bank_held,
        0,
      );
      const totalHeld = totalCashHeld + totalBankHeld;
      const totalEmployeeDiscount = form.employee.reduce(
        (sum, emp) => sum + emp.discount,
        0,
      );
      const totalDiscount = totalEmployeeDiscount + form.company.discount;

      // Choose one period id for shared records (discount/held records need a period_id)
      // If you want separate records per period type, you can duplicate inserts.
      const primaryPeriodId = bankPeriodData?.id || cashPeriodData?.id;

      if (!primaryPeriodId) {
        console.error("[PercentageDistribution] primaryPeriodId not found");
        return { success: false, message: "فشل تحديد فترة أساسية" };
      }

      // 5) Process employees (held + discounts + accounts + payroll)
      for (const emp of form.employee) {
        // 5.1 Held records
        if (emp.bank_held > 0) {
          const { error } = await supabase.from("company_held").insert({
            amount: emp.bank_held,
            employee_id: emp.employee_id,
            period_id: primaryPeriodId,
            type: "bank",
            note: emp.note || "",
          });

          if (error) {
            logErr("insert company_held bank error", error);
            return {
              success: false,
              message: "خطأ في تسجيل المبلغ المحتجز (بنك)",
            };
          }
        }

        if (emp.cash_held > 0) {
          const { error } = await supabase.from("company_held").insert({
            amount: emp.cash_held,
            employee_id: emp.employee_id,
            period_id: primaryPeriodId,
            type: "cash",
            note: emp.note || "",
          });

          if (error) {
            logErr("insert company_held cash error", error);
            return {
              success: false,
              message: "خطأ في تسجيل المبلغ المحتجز (نقدي)",
            };
          }
        }

        // 5.2 Employee discount record
        if (emp.discount > 0) {
          const { error } = await supabase.from("employee_discounts").insert({
            amount: emp.discount,
            user_id: emp.employee_id,
            period_id: primaryPeriodId,
            note: emp.note || "",
          });

          if (error) {
            logErr("insert employee_discounts error", error);
            return { success: false, message: "خطأ في تسجيل خصم الموظف" };
          }
        }

        // 5.3 Update employee account + payroll
        const empAccount = employeeAccounts.find(
          (acc) => acc.id === emp.employee_id,
        );
        if (!empAccount) {
          console.error(
            "[PercentageDistribution] employee account not found for employee",
            emp.employee_id,
          );
          return { success: false, message: "حساب موظف غير موجود" };
        }

        // Safer discount split: proportional to amounts
        const grossTotal = emp.BankAmount + emp.CashAmount;
        const bankDiscount =
          grossTotal > 0 ? emp.discount * (emp.BankAmount / grossTotal) : 0;
        const cashDiscount = emp.discount - bankDiscount;

        const netBank = emp.BankAmount - emp.bank_held - bankDiscount;
        const netCash = emp.CashAmount - emp.cash_held - cashDiscount;

        const { error: updateAccountError } = await supabase
          .from("employee_account")
          .update({
            bank_balance: empAccount.bank_balance + netBank, // ✅ correct: held removed
            bank_held: empAccount.bank_held + emp.bank_held,
            cash_balance: empAccount.cash_balance + netCash, // ✅ correct: held removed
            cash_held: empAccount.cash_held + emp.cash_held,
          })
          .eq("id", empAccount.id);

        if (updateAccountError) {
          logErr("update employee_account error", updateAccountError);
          return { success: false, message: "خطأ في تحديث حساب الموظف" };
        }

        // Payroll entries (only if positive)
        if (netBank > 0) {
          const { error } = await supabase.from("payroll").insert({
            employee_id: emp.employee_id,
            pay_date: today(), // ✅ date only
            project_id: form.project_id,
            total_salary: netBank,
            payment_method: "bank",
            status: "pending",
            basic_salary: 0,
            percentage_salary: netBank,
            created_by: user.id,
          });

          if (error) {
            logErr("insert payroll bank error", error);
            return { success: false, message: "فشل إنشاء قيد الرواتب (بنك)" };
          }
        }

        if (netCash > 0) {
          const { error } = await supabase.from("payroll").insert({
            project_id: form.project_id,
            employee_id: emp.employee_id,
            pay_date: today(), // ✅ date only
            total_salary: netCash,
            payment_method: "cash",
            status: "pending",
            basic_salary: 0,
            percentage_salary: netCash,
            created_by: user.id,
          });

          if (error) {
            logErr("insert payroll cash error", error);
            return { success: false, message: "فشل إنشاء قيد الرواتب (نقدي)" };
          }
        }
      }

      // 6) Update company accounts
      const companyMainAccount = companyAccounts.find(
        (acc) => acc.type === "main",
      );
      const companyDiscountAccount = companyAccounts.find(
        (acc) => acc.type === "discount",
      );
      const companyHeldAccount = companyAccounts.find(
        (acc) => acc.type === "held",
      );

      if (!companyMainAccount) {
        console.error(
          "[PercentageDistribution] company main account not found",
        );
        return { success: false, message: "حساب الشركة الرئيسي غير موجود" };
      }

      // 6.1 main account gets company amounts
      {
        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance:
              companyMainAccount.bank_balance + form.company.BankAmount,
            cash_balance:
              companyMainAccount.cash_balance + form.company.CashAmount,
          })
          .eq("id", companyMainAccount.id);

        if (error) {
          logErr("update company main account error", error);
          return {
            success: false,
            message: "خطأ في تحديث حساب الشركة الرئيسي",
          };
        }
      }

      // 6.2 discount account
      if (totalDiscount > 0) {
        if (!companyDiscountAccount) {
          console.error(
            "[PercentageDistribution] company discount account not found",
          );
          return { success: false, message: "حساب خصم الشركة غير موجود" };
        }

        // Split discount proportionally using total company+employees amounts (optional),
        // but simplest: split equally bank/cash. Change if you want proportional.
        const discountPerType = totalDiscount / 2;

        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyDiscountAccount.bank_balance + discountPerType,
            cash_balance: companyDiscountAccount.cash_balance + discountPerType,
          })
          .eq("id", companyDiscountAccount.id);

        if (error) {
          logErr("update company discount account error", error);
          return { success: false, message: "خطأ في تحديث حساب خصم الشركة" };
        }

        // record company discount row (company-only)
        if (form.company.discount > 0) {
          const { error: insertCompanyDiscountError } = await supabase
            .from("company_discounts")
            .insert({
              period_id: primaryPeriodId,
              amount: form.company.discount,
              note: form.company.note || "",
            });

          if (insertCompanyDiscountError) {
            logErr(
              "insert company_discounts error",
              insertCompanyDiscountError,
            );
            return { success: false, message: "خطأ في تسجيل خصم الشركة" };
          }
        }
      }

      // 6.3 held account
      if (totalHeld > 0) {
        if (!companyHeldAccount) {
          console.error(
            "[PercentageDistribution] company held account not found",
          );
          return { success: false, message: "حساب المبالغ المحتجزة غير موجود" };
        }

        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyHeldAccount.bank_balance + totalBankHeld,
            cash_balance: companyHeldAccount.cash_balance + totalCashHeld,
          })
          .eq("id", companyHeldAccount.id);

        if (error) {
          logErr("update company held account error", error);
          return {
            success: false,
            message: "خطأ في تحديث حساب المبالغ المحتجزة",
          };
        }
      }

      // 7) Reset project percentage for next period
      // NOTE: project_percentage.period_start is a DATE, so use today()
      const { error: updateProjectError } = await supabase
        .from("project_percentage")
        .update({
          period_percentage: 0,
          period_start: today(),
        })
        .eq("project_id", form.project_id);

      if (updateProjectError) {
        logErr("reset project_percentage error", updateProjectError);
        return { success: false, message: "خطأ في تحديث نسبة المشروع" };
      }

      return { success: true, message: "تم توزيع النسب بنجاح" };
    } catch (error) {
      logErr("unexpected error", error);
      return { success: false, message: "حدث خطأ غير متوقع أثناء توزيع النسب" };
    }
  };

  const MapsDistribution = async (form: MapsDistributionValues) => {
    console.log("MapsDistribution form data:", form);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      return { success: false, message: "المستخدم غير مسجل الدخول" };
    }
    const user = userData.user;

    // 1 fetch project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", form.project_id)
      .single();

    if (projectError) {
      console.error("error fetching project", projectError);
      return { success: false, message: "خطأ في جلب بيانات المشروع" };
    }

    // 1.2 fetch project balance
    const { data: projectBalanceData, error: projectBalanceError } =
      await supabase
        .from("project_balances")
        .select("*")
        .eq("project_id", form.project_id)
        .eq("currency", "LYD")
        .single();

    if (projectBalanceError) {
      console.error("error fetching project balance", projectBalanceError);
      return { success: false, message: "خطأ في جلب رصيد المشروع" };
    }

    // 1.3 fetch company accounts
    const { data: companyData, error: companyError } = await supabase
      .from("company_account")
      .select("*")
      .eq("type", "maps")
      .single();

    if (companyError || !companyData) {
      console.error("error fetching company accounts", companyError);
      return { success: false, message: "خطأ في جلب بيانات حسابات الشركة" };
    }

    // 2  fetch Employee accounts
    const employeeIds = [
      ...new Set(form.map.flatMap((m) => m.employee.map((e) => e.employee_id))),
    ];

    const { data: employeeAccounts, error: employeeAccountsError } =
      await supabase.from("employee_account").select("*").in("id", employeeIds);

    if (employeeAccountsError) {
      console.error("error fetching employee accounts", employeeAccountsError);
      return { success: false, message: "خطأ في جلب بيانات حسابات الموظفين" };
    }

    // 3 insert expense for the project
    const grandTotal = form.map.reduce((sum, map) => sum + map.total, 0);

    const { data: expenseData, error: expenseError } = await supabase
      .from("project_expenses")
      .insert({
        project_id: form.project_id,
        description: `مصروفات خرائط للمشروع ${projectData?.name || ""}`,
        created_by: user.id,
        expense_date: new Date().toISOString(),
        expense_type: "maps",
        phase: "initial",
        total_amount: grandTotal,
        amount_paid: grandTotal,
        payment_counter: 1,
        serial_number: projectData?.expense_counter,
      } as ProjectExpenses)
      .select()
      .single();

    if (expenseError) {
      console.error("error inserting project expense", expenseError);
      return { success: false, message: "خطأ في تسجيل مصروف المشروع" };
    }

    //3.2 PAYMENT RECORD
    const { error: paymentError } = await supabase
      .from("expense_payments")
      .insert({
        amount: grandTotal,
        expense_id: expenseData?.id,
        payment_method: form.payment_method,
        created_at: new Date().toISOString(),
        created_by: user.id,
        serial_number: 1,
      } as ExpensePayments);

    if (paymentError) {
      console.error("error inserting expense payment", paymentError);
      return { success: false, message: "خطأ في تسجيل دفعة المصروف" };
    }

    // 3.1 update peoject balance
    const newProjectBalance = (projectBalanceData?.balance || 0) - grandTotal;
    const { error: updateProjectBalanceError } = await supabase
      .from("project_balances")
      .update({
        balance: newProjectBalance,
        total_expense: (projectBalanceData?.total_expense || 0) + grandTotal,
      })
      .eq("id", projectBalanceData?.id);

    if (updateProjectBalanceError) {
      console.error(
        "error updating project balance",
        updateProjectBalanceError,
      );
      return { success: false, message: "خطأ في تحديث رصيد المشروع" };
    }

    // 4 Create a maps distribution record
    const { data: mapsDistributionData, error: mapsDistributionError } =
      await supabase
        .from("maps_distributions")
        .insert({
          created_by: user.id,
          description: `توزيع خرائط للمشروع ${projectData?.name || ""}`,
          project_id: form.project_id,
          total_amount: grandTotal,
        })
        .select()
        .single();

    if (mapsDistributionError) {
      console.error(
        "error creating distribution record",
        mapsDistributionError,
      );
      return { success: false, message: "خطأ في إنشاء سجل التوزيع" };
    }

    const companyTotal = form.map.reduce(
      (sum, map) => sum + map.company.amount,
      0,
    );

    // 5 Process each map
    for (const mapItem of form.map) {
      const { data: mapData, error: mapError } = await supabase
        .from("maps_distribution_items")
        .insert({
          distribution_id: mapsDistributionData.id,
          type_id: mapItem.type_id,
          price: mapItem.price,
          quantity: mapItem.quantity,
          total: mapItem.total,
        })
        .select()
        .single();

      if (mapError) {
        console.error("error creating map item", mapError);
        return { success: false, message: "خطأ في إنشاء بند الخريطة" };
      }

      // 6 Process employees for this map
      const employeeDistributions = mapItem.employee.map((emp) => ({
        map_item_id: mapData.id,
        employee_id: emp.employee_id,
        percentage: emp.percentage,
        amount: emp.amount,
        distribution_type: "employee",
      }));

      const { error: empDistError } = await supabase
        .from("maps_distribution_details")
        .insert(employeeDistributions);

      if (empDistError) {
        console.error("error creating employee distributions", empDistError);
        return {
          success: false,
          message: "خطأ في إنشاء توزيعات الموظفين",
        };
      }

      // 6.1 Process company for this map
      const { error: companyDistError } = await supabase
        .from("maps_distribution_details")
        .insert({
          map_item_id: mapData.id,
          employee_id: null,
          percentage: mapItem.company.percentage,
          amount: mapItem.company.amount,
          distribution_type: "company",
        });

      if (companyDistError) {
        console.error("error creating company distribution", companyDistError);
        return { success: false, message: "خطأ في إنشاء توزيع الشركة" };
      }

      // 7 Update employee accounts
      for (const emp of mapItem.employee) {
        const empAccount = employeeAccounts?.find(
          (acc) => acc.id === emp.employee_id,
        );

        if (empAccount && emp.amount > 0) {
          if (form.payment_method === "bank") {
            const { error: updateAccountError } = await supabase
              .from("employee_account")
              .update({
                bank_balance: empAccount.bank_balance + emp.amount,
              })
              .eq("id", empAccount.id);

            if (updateAccountError) {
              console.error(
                "error updating bank employee account",
                updateAccountError,
              );
              return { success: false, message: "خطأ في تحديث حساب الموظف" };
            }

            // Create payroll entry
            const { error: payrollError } = await supabase
              .from("payroll")
              .insert({
                employee_id: emp.employee_id,
                pay_date: new Date().toISOString(),
                total_salary: emp.amount,
                payment_method: "bank",
                status: "pending",
                basic_salary: 0,
                percentage_salary: emp.amount,
                created_by: user.id,
              });

            if (payrollError) {
              console.error("error creating bank payroll entry", payrollError);
              return { success: false, message: "فشل إنشاء قيد الرواتب" };
            }
          } else if (form.payment_method === "cash") {
            const { error: updateAccountError } = await supabase
              .from("employee_account")
              .update({
                cash_balance: empAccount.cash_balance + emp.amount,
              })
              .eq("id", empAccount.id);

            if (updateAccountError) {
              console.error(
                "error updating cash employee account",
                updateAccountError,
              );
              return { success: false, message: "خطأ في تحديث حساب الموظف" };
            }

            // Create payroll entry
            const { error: payrollError } = await supabase
              .from("payroll")
              .insert({
                employee_id: emp.employee_id,
                pay_date: new Date().toISOString(),
                total_salary: emp.amount,
                payment_method: "cash",
                status: "pending",
                basic_salary: 0,
                percentage_salary: emp.amount,
                created_by: user.id,
              });

            if (payrollError) {
              console.error("error creating cash payroll entry", payrollError);
              return { success: false, message: "فشل إنشاء قيد الرواتب" };
            }
          }
        }
      }
    }

    // 9 Update company account

    const { error: updateCompanyAccountError } = await supabase
      .from("company_account")
      .update({
        bank_balance:
          companyData.bank_balance +
          (form.payment_method === "bank" ? companyTotal : 0),
        cash_balance:
          companyData.cash_balance +
          (form.payment_method === "cash" ? companyTotal : 0),
      })
      .eq("id", companyData.id);

    if (updateCompanyAccountError) {
      console.error(
        "error updating company account",
        updateCompanyAccountError,
      );
      return { success: false, message: "خطأ في تحديث حساب الشركة" };
    }
    // 10 update project expense and maps counter
    const { error: updateProjectError } = await supabase
      .from("projects")
      .update({
        expense_counter: projectData.expense_counter + 1,
        map_counter: projectData.map_counter + 1,
      })
      .eq("id", form.project_id);

    if (updateProjectError) {
      console.error("error updating project counters", updateProjectError);
      return { success: false, message: "خطأ في تحديث عدادات المشروع" };
    }

    return { success: true };
  };

  const fixedPayroll = async (form: FixedPayrollFormValues) => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData || !userData.user) {
      return { success: false, message: "المستخدم غير مسجل الدخول" };
    }

    //insert payroll entries for each fixed employee
    for (const emp of form.employees) {
      const { error: payrollError } = await supabase.from("payroll").insert([
        {
          employee_id: emp.id,
          project_id: form.project_id,
          pay_date: new Date().toISOString(),
          total_salary: emp.amount,
          basic_salary: emp.amount,
          percentage_salary: 0,
          created_by: userData.user.id,
          payment_method: "cash",
          status: "pending",
        },
      ]);

      if (payrollError) {
        console.error("error creating payroll entry", payrollError);
        return { success: false, message: "فشل إنشاء قيد الرواتب" };
      }
    }

    return { success: true };
  };

  return {
    payroll,
    fixedEmployees,
    loading,
    error,
    PercentageDistribution,
    fixedPayroll,
    MapsDistribution,
  };
}

export function useDetailedPayroll(id: string) {
  const [payroll, setPayroll] = useState<PayrollWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchPayroll() {
      setLoading(true);
      const { data, error } = await supabase
        .from("payroll")
        .select(`*, employees (first_name, last_name, salary_type)`)
        .eq("id", id)
        .single();
      if (error) {
        console.error("error fetching payroll", error);
        setError(error);
      } else {
        setPayroll(data);
      }
      setLoading(false);
    }
    fetchPayroll();
  }, [id]); // runs once on mount or when id changes

  return { payroll, loading, error };
}
