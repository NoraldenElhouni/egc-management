import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { PayrollWithRelations } from "../types/extended.type";
import { PercentageDistributionFormValues } from "../types/schema/PercentageDistribution.schema";
import {
  Employees,
  ExpensePayments,
  ProjectExpenses,
} from "../types/global.type";
import { FixedPayrollFormValues } from "../types/schema/fixedPayroll.schema";
import { MapsDistributionValues } from "../types/schema/MapsDistribution.schema";

type PeriodData = { id: string; [key: string]: unknown } | null;

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
    const today = () => new Date().toISOString().split("T")[0];

    const logErr = (label: string, error: unknown) =>
      console.error(`[PercentageDistribution] ${label}`, error);

    // ── 0) Auth ────────────────────────────────────────────────────────────────
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      logErr("auth error", authError);
      return { success: false, message: "خطأ في التحقق من المستخدم" };
    }
    const user = userData.user;

    if (!form.employee?.length)
      return { success: false, message: "لا يوجد موظفين للتوزيع" };

    if (!form.log_ids?.length)
      return { success: false, message: "يجب اختيار سجل واحد على الأقل" };

    try {
      // ── 1) Fetch the selected logs to derive actual cash/bank totals ─────────
      // We re-fetch from DB to be safe (user could have tampered with client state)
      const { data: selectedLogs, error: logsError } = await supabase
        .from("project_percentage_logs")
        .select("id, amount, percentage, distributed")
        .in("id", form.log_ids)
        .eq("project_id", form.project_id)
        .eq("distributed", false); // double-check they're still undistributed

      if (logsError) {
        logErr("fetch selected logs error", logsError);
        return { success: false, message: "خطأ في جلب السجلات المختارة" };
      }

      // Guard: ensure all requested log IDs were found and are undistributed
      if (!selectedLogs?.length) {
        return {
          success: false,
          message: "السجلات المختارة غير موجودة أو تم توزيعها مسبقاً",
        };
      }

      if (selectedLogs.length !== form.log_ids.length) {
        const foundIds = new Set(selectedLogs.map((l) => l.id));
        const missing = form.log_ids.filter((id) => !foundIds.has(id));
        logErr("some logs already distributed or not found", missing);
        return {
          success: false,
          message: `بعض السجلات تم توزيعها مسبقاً أو غير موجودة (${missing.length} سجلات)`,
        };
      }

      // ── 2) Fetch project_percentage for cash/bank ratio ───────────────────────
      const { data: projectPercentRows, error: projectError } = await supabase
        .from("project_percentage")
        .select("*")
        .eq("project_id", form.project_id)
        .eq("currency", "LYD");

      if (projectError || !projectPercentRows?.length) {
        logErr("fetch project_percentage error", projectError);
        return { success: false, message: "خطأ في جلب بيانات نسبة المشروع" };
      }

      const bankRow = projectPercentRows.find((p) => p.type === "bank");
      const cashRow = projectPercentRows.find((p) => p.type === "cash");

      // Use the pre-computed cash/bank amounts passed directly from the UI.
      // Previously these were re-derived from project_percentage.period_percentage
      // which can be 0 or stale — causing false "exceeds available" errors.
      const selectedTotal = selectedLogs.reduce(
        (s, l) => s + (l.amount ?? 0),
        0,
      );
      const selectedCash = form.selected_cash;
      const selectedBank = form.selected_bank;

      // ── 3) Fetch company & employee accounts ─────────────────────────────────
      const { data: companyAccounts, error: companyError } = await supabase
        .from("company_account")
        .select("*")
        .in("type", ["main", "discount", "held"])
        .eq("status", "active");

      if (companyError || !companyAccounts?.length) {
        logErr("fetch company_account error", companyError);
        return { success: false, message: "خطأ في جلب بيانات حساب الشركة" };
      }

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

      const missingAccounts = employeeIds.filter(
        (id) => !employeeAccounts?.some((acc) => acc.id === id),
      );
      if (missingAccounts.length) {
        return { success: false, message: "يوجد موظفين بدون حساب مالي" };
      }

      // ── 4) Create period(s) using SELECTED amounts (not full period_percentage) ─
      let bankPeriodData: PeriodData = null;
      let cashPeriodData: PeriodData = null;

      if (bankRow && selectedBank > 0) {
        const { data: bankPeriod, error: bankPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            start_date: bankRow.period_start,
            end_date: today(),
            total_amount: selectedBank, // ✅ only the selected portion
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

      if (cashRow && selectedCash > 0) {
        const { data: cashPeriod, error: cashPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            start_date: cashRow.period_start,
            end_date: today(),
            total_amount: selectedCash, // ✅ only the selected portion
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

      const periodsToUse = [bankPeriodData, cashPeriodData].filter(Boolean);
      if (!periodsToUse.length)
        return { success: false, message: "لا توجد فترات لإنشائها" };

      const primaryPeriodId = bankPeriodData?.id ?? cashPeriodData?.id;

      if (!primaryPeriodId) {
        logErr("no period created", { bankPeriodData, cashPeriodData });
        return { success: false, message: "خطأ غير متوقع في إنشاء الفترات" };
      }

      // ── 5) Insert period items (company + employees) ──────────────────────────
      type PeriodMode = "bank" | "cash" | "both";

      const createCompanyItem = async (periodId: string, mode: PeriodMode) => {
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
            note: form.company.note ?? "",
            user_id: null,
          });

        if (error) {
          logErr(`company item (${mode})`, error);
          return false;
        }
        return true;
      };

      const createEmployeeItems = async (
        periodId: string,
        mode: PeriodMode,
      ) => {
        const rows = form.employee.map((emp) => ({
          period_id: periodId,
          bank_amount: mode === "cash" ? 0 : emp.BankAmount,
          cash_amount: mode === "bank" ? 0 : emp.CashAmount,
          bank_held: mode === "cash" ? 0 : emp.bank_held,
          cash_held: mode === "bank" ? 0 : emp.cash_held,
          discount: emp.discount,
          total: emp.total,
          user_id: emp.employee_id,
          percentage: emp.percentage,
          item_type: "employee",
          note: emp.note ?? "",
        }));

        const { error } = await supabase
          .from("project_percentage_period_items")
          .insert(rows);

        if (error) {
          logErr(`employee items (${mode})`, error);
          return false;
        }
        return true;
      };

      if (bankPeriodData && cashPeriodData) {
        if (!(await createCompanyItem(bankPeriodData.id as string, "bank")))
          return {
            success: false,
            message: "خطأ في تسجيل بند فترة الشركة (بنك)",
          };
        if (!(await createEmployeeItems(bankPeriodData.id as string, "bank")))
          return {
            success: false,
            message: "خطأ في تسجيل بنود فترة الموظفين (بنك)",
          };
        if (!(await createCompanyItem(cashPeriodData.id as string, "cash")))
          return {
            success: false,
            message: "خطأ في تسجيل بند فترة الشركة (نقدي)",
          };
        if (!(await createEmployeeItems(cashPeriodData.id as string, "cash")))
          return {
            success: false,
            message: "خطأ في تسجيل بنود فترة الموظفين (نقدي)",
          };
      } else {
        const onlyPeriod = periodsToUse[0]!;
        if (!(await createCompanyItem(onlyPeriod.id as string, "both")))
          return { success: false, message: "خطأ في تسجيل بند فترة الشركة" };
        if (!(await createEmployeeItems(onlyPeriod.id as string, "both")))
          return { success: false, message: "خطأ في تسجيل بنود فترة الموظفين" };
      }

      // ── 6) Mark selected logs as distributed ─────────────────────────────────
      // This is the critical new step — links distribution back to the source logs
      const { error: markLogsError } = await supabase
        .from("project_percentage_logs")
        .update({ distributed: true })
        .in("id", form.log_ids)
        .eq("project_id", form.project_id);

      if (markLogsError) {
        logErr("mark logs as distributed error", markLogsError);
        return {
          success: false,
          message: "تم الحفظ لكن فشل تحديث حالة السجلات — تواصل مع الدعم",
        };
      }

      // ── 7) Process each employee: held + discounts + account + payroll ────────
      for (const emp of form.employee) {
        // 7.1 Held records
        if (emp.bank_held > 0) {
          const { error } = await supabase.from("company_held").insert({
            amount: emp.bank_held,
            employee_id: emp.employee_id,
            period_id: primaryPeriodId,
            type: "bank",
            note: emp.note ?? "",
          });
          if (error) {
            logErr("insert company_held bank", error);
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
            note: emp.note ?? "",
          });
          if (error) {
            logErr("insert company_held cash", error);
            return {
              success: false,
              message: "خطأ في تسجيل المبلغ المحتجز (نقدي)",
            };
          }
        }

        // 7.2 Employee discount
        if (emp.discount > 0) {
          const { error } = await supabase.from("employee_discounts").insert({
            amount: emp.discount,
            user_id: emp.employee_id,
            period_id: primaryPeriodId,
            note: emp.note ?? "",
          });
          if (error) {
            logErr("insert employee_discounts", error);
            return { success: false, message: "خطأ في تسجيل خصم الموظف" };
          }
        }

        // 7.3 Update employee account balance
        const empAccount = employeeAccounts!.find(
          (a) => a.id === emp.employee_id,
        );
        if (!empAccount)
          return {
            success: false,
            message: `حساب الموظف ${emp.employee_id} غير موجود`,
          };

        // Split discount proportionally between bank/cash
        const gross = emp.BankAmount + emp.CashAmount;
        const bankDiscount =
          gross > 0 ? emp.discount * (emp.BankAmount / gross) : 0;
        const cashDiscount = emp.discount - bankDiscount;

        const netBank = emp.BankAmount - emp.bank_held - bankDiscount;
        const netCash = emp.CashAmount - emp.cash_held - cashDiscount;

        const { error: updateAccErr } = await supabase
          .from("employee_account")
          .update({
            bank_balance: empAccount.bank_balance + Math.max(0, netBank),
            bank_held: empAccount.bank_held + emp.bank_held,
            cash_balance: empAccount.cash_balance + Math.max(0, netCash),
            cash_held: empAccount.cash_held + emp.cash_held,
          })
          .eq("id", empAccount.id);

        if (updateAccErr) {
          logErr("update employee_account", updateAccErr);
          return { success: false, message: "خطأ في تحديث حساب الموظف" };
        }

        // 7.4 Payroll entries
        if (netBank > 0) {
          const { error } = await supabase.from("payroll").insert({
            employee_id: emp.employee_id,
            pay_date: today(),
            project_id: form.project_id,
            total_salary: netBank,
            payment_method: "bank",
            status: "pending",
            basic_salary: 0,
            percentage_salary: netBank,
            created_by: user.id,
          });
          if (error) {
            logErr("insert payroll bank", error);
            return { success: false, message: "فشل إنشاء قيد الرواتب (بنك)" };
          }
        }

        if (netCash > 0) {
          const { error } = await supabase.from("payroll").insert({
            employee_id: emp.employee_id,
            pay_date: today(),
            project_id: form.project_id,
            total_salary: netCash,
            payment_method: "cash",
            status: "pending",
            basic_salary: 0,
            percentage_salary: netCash,
            created_by: user.id,
          });
          if (error) {
            logErr("insert payroll cash", error);
            return { success: false, message: "فشل إنشاء قيد الرواتب (نقدي)" };
          }
        }
      }

      // ── 8) Update company accounts ────────────────────────────────────────────
      const companyMain = companyAccounts.find((a) => a.type === "main");
      const companyDiscount = companyAccounts.find(
        (a) => a.type === "discount",
      );
      const companyHeld = companyAccounts.find((a) => a.type === "held");

      if (!companyMain)
        return { success: false, message: "حساب الشركة الرئيسي غير موجود" };

      // 8.1 Main account — company's own share
      {
        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyMain.bank_balance + form.company.BankAmount,
            cash_balance: companyMain.cash_balance + form.company.CashAmount,
          })
          .eq("id", companyMain.id);
        if (error) {
          logErr("update company main account", error);
          return {
            success: false,
            message: "خطأ في تحديث حساب الشركة الرئيسي",
          };
        }
      }

      // 8.2 Discount account
      const totalEmployeeDiscount = form.employee.reduce(
        (s, e) => s + e.discount,
        0,
      );
      const totalDiscount = totalEmployeeDiscount + form.company.discount;

      if (totalDiscount > 0) {
        if (!companyDiscount)
          return { success: false, message: "حساب خصم الشركة غير موجود" };

        // Proportional split by selected cash/bank
        const discountBank =
          selectedTotal > 0
            ? totalDiscount * (selectedBank / selectedTotal)
            : totalDiscount / 2;
        const discountCash = totalDiscount - discountBank;

        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyDiscount.bank_balance + discountBank,
            cash_balance: companyDiscount.cash_balance + discountCash,
          })
          .eq("id", companyDiscount.id);
        if (error) {
          logErr("update company discount account", error);
          return { success: false, message: "خطأ في تحديث حساب خصم الشركة" };
        }

        if (form.company.discount > 0) {
          const { error: insertErr } = await supabase
            .from("company_discounts")
            .insert({
              period_id: primaryPeriodId,
              amount: form.company.discount,
              note: form.company.note ?? "",
            });
          if (insertErr) {
            logErr("insert company_discounts", insertErr);
            return { success: false, message: "خطأ في تسجيل خصم الشركة" };
          }
        }
      }

      // 8.3 Held account
      const totalCashHeld = form.employee.reduce((s, e) => s + e.cash_held, 0);
      const totalBankHeld = form.employee.reduce((s, e) => s + e.bank_held, 0);
      const totalHeld = totalCashHeld + totalBankHeld;

      if (totalHeld > 0) {
        if (!companyHeld)
          return { success: false, message: "حساب المبالغ المحتجزة غير موجود" };

        const { error } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyHeld.bank_balance + totalBankHeld,
            cash_balance: companyHeld.cash_balance + totalCashHeld,
          })
          .eq("id", companyHeld.id);
        if (error) {
          logErr("update company held account", error);
          return {
            success: false,
            message: "خطأ في تحديث حساب المبالغ المحتجزة",
          };
        }
      }

      // ── 9) Reduce project_percentage by the distributed amount ───────────────
      // Instead of resetting to 0 (old behavior), we subtract only what was distributed.
      // This preserves any logs that were NOT selected for this distribution run.
      if (cashRow && selectedCash > 0) {
        const { error } = await supabase
          .from("project_percentage")
          .update({
            period_percentage: Math.max(
              0,
              cashRow.period_percentage - selectedCash,
            ),
          })
          .eq("id", cashRow.id);
        if (error) {
          logErr("reduce cash period_percentage", error);
          return {
            success: false,
            message: "خطأ في تحديث نسبة النقدي للمشروع",
          };
        }
      }

      if (bankRow && selectedBank > 0) {
        const { error } = await supabase
          .from("project_percentage")
          .update({
            period_percentage: Math.max(
              0,
              bankRow.period_percentage - selectedBank,
            ),
          })
          .eq("id", bankRow.id);
        if (error) {
          logErr("reduce bank period_percentage", error);
          return { success: false, message: "خطأ في تحديث نسبة البنك للمشروع" };
        }
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
