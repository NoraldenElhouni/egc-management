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

  const PercentageDistribution = async (
    form: PercentageDistributionFormValues
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      return { success: false, message: "المستخدم غير مسجل الدخول" };
    }
    const user = userData.user;

    try {
      // 1. Fetch all required data
      // 1.1 Company accounts
      const { data: companyData, error: companyError } = await supabase
        .from("company_account")
        .select("*")
        .in("type", ["main", "discount", "held"]);

      if (companyError || !companyData) {
        console.error("error fetching company accounts", companyError);
        return { success: false, message: "خطأ في جلب بيانات حساب الشركة" };
      }

      // 1.2 Employee accounts
      const { data: employeeAccounts, error: employeeAccountsError } =
        await supabase
          .from("employee_account")
          .select("*")
          .in(
            "id",
            form.employee.map((e) => e.employee_id)
          );

      if (employeeAccountsError) {
        console.error(
          "error fetching employee accounts",
          employeeAccountsError
        );
        return { success: false, message: "خطأ في جلب بيانات حسابات الموظفين" };
      }

      // 1.3 Project percentage data
      const { data: projectData, error: projectError } = await supabase
        .from("project_percentage")
        .select("*")
        .eq("project_id", form.project_id);

      if (projectError || !projectData) {
        console.error("error fetching project percentage", projectError);
        return { success: false, message: "خطأ في جلب بيانات نسبة المشروع" };
      }

      const bankPercentage = projectData.find((proj) => proj.type === "bank");
      const cashPercentage = projectData.find((proj) => proj.type === "cash");

      // 2. Insert period percentages for bank and cash
      let bankPeriodData = null;
      let cashPeriodData = null;

      // 2.1 Insert bank period
      if (bankPercentage) {
        const { data: bankPeriod, error: bankPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            end_date: new Date().toISOString(),
            start_date: bankPercentage.period_start,
            total_amount: bankPercentage.period_percentage, // Fixed: was total_percentage
            type: "bank",
          })
          .select()
          .single();

        if (bankPeriodError) {
          console.error("error inserting bank period", bankPeriodError);
          return { success: false, message: "خطأ في تسجيل فترة البنك" };
        }
        bankPeriodData = bankPeriod;
      }

      // 2.2 Insert cash period
      if (cashPercentage) {
        const { data: cashPeriod, error: cashPeriodError } = await supabase
          .from("project_percentage_periods")
          .insert({
            project_id: form.project_id,
            created_by: user.id,
            end_date: new Date().toISOString(),
            start_date: cashPercentage.period_start,
            total_amount: cashPercentage.period_percentage, // Fixed: was total_percentage
            type: "cash", // Fixed: was "bank"
          })
          .select()
          .single();

        if (cashPeriodError) {
          console.error("error inserting cash period", cashPeriodError);
          return { success: false, message: "خطأ في تسجيل فترة النقدي" };
        }
        cashPeriodData = cashPeriod;
      }

      if (!bankPeriodData && !cashPeriodData) {
        return { success: false, message: "لا توجد بيانات نسبة للمشروع" };
      }

      // Use bank period as main period (or cash if bank doesn't exist)
      const periodData = bankPeriodData || cashPeriodData;

      // 3. Insert period items for company
      if (!periodData) {
        return { success: false, message: "لا توجد بيانات فترة للمشروع" };
      }

      const { error: insertCompanyItemError } = await supabase
        .from("project_percentage_period_items")
        .insert({
          period_id: periodData.id,
          bank_amount: form.company.BankAmount,
          cash_amount: form.company.CashAmount,
          discount: form.company.discount,
          total: form.company.total,
          bank_held: 0,
          cash_held: 0,
          percentage: form.company.percentage,
          item_type: "company",
          note: form.company.note || "",
          user_id: null, // Company doesn't have a user_id
        });

      if (insertCompanyItemError) {
        console.error(
          "error inserting company period item",
          insertCompanyItemError
        );
        return { success: false, message: "خطأ في تسجيل بند فترة الشركة" };
      }

      // 4. Insert period items for employees
      const employeePeriodItems = form.employee.map((emp) => ({
        period_id: periodData.id,
        bank_amount: emp.BankAmount,
        cash_amount: emp.CashAmount,
        discount: emp.discount,
        total: emp.total,
        bank_held: emp.bank_held,
        cash_held: emp.cash_held,
        user_id: emp.employee_id,
        percentage: emp.percentage,
        item_type: "employee",
        note: emp.note || "",
      }));

      const { error: insertEmployeePeriodItemsError } = await supabase
        .from("project_percentage_period_items")
        .insert(employeePeriodItems);

      if (insertEmployeePeriodItemsError) {
        console.error(
          "error inserting employee period items",
          insertEmployeePeriodItemsError
        );
        return { success: false, message: "خطأ في تسجيل بنود فترة الموظفين" };
      }

      // 5. Calculate totals
      const totalCashHeld = form.employee.reduce(
        (sum, emp) => sum + emp.cash_held,
        0
      );
      const totalBankHeld = form.employee.reduce(
        (sum, emp) => sum + emp.bank_held,
        0
      );
      const totalHeld = totalCashHeld + totalBankHeld;
      const totalDiscount =
        form.employee.reduce((sum, emp) => sum + emp.discount, 0) +
        form.company.discount;

      // 6. Process each employee
      for (const emp of form.employee) {
        // 6.1 Insert held amounts
        if (emp.bank_held > 0) {
          const { error: bankHeldError } = await supabase
            .from("company_held")
            .insert({
              amount: emp.bank_held,
              employee_id: emp.employee_id,
              period_id: periodData.id,
              type: "bank",
              note: emp.note || "",
            });

          if (bankHeldError) {
            console.error("error inserting bank held", bankHeldError);
            return {
              success: false,
              message: "خطأ في تسجيل المبلغ المحتجز (بنك)",
            };
          }
        }

        if (emp.cash_held > 0) {
          const { error: cashHeldError } = await supabase
            .from("company_held")
            .insert({
              amount: emp.cash_held,
              employee_id: emp.employee_id,
              period_id: periodData.id,
              type: "cash",
              note: emp.note || "",
            });

          if (cashHeldError) {
            console.error("error inserting cash held", cashHeldError);
            return {
              success: false,
              message: "خطأ في تسجيل المبلغ المحتجز (نقدي)",
            };
          }
        }

        // 6.2 Insert employee discount
        if (emp.discount > 0) {
          const { error: discountError } = await supabase
            .from("employee_discounts")
            .insert({
              amount: emp.discount,
              user_id: emp.employee_id,
              period_id: periodData.id,
              note: emp.note || "",
            });

          if (discountError) {
            console.error("error inserting employee discount", discountError);
            return { success: false, message: "خطأ في تسجيل خصم الموظف" };
          }
        }

        // 6.3 Update employee account
        const empAccount = employeeAccounts?.find(
          (acc) => acc.id === emp.employee_id
        );

        if (empAccount) {
          // Calculate net amounts (discount split between cash and bank)
          const discountPerType = emp.discount / 2;
          const netBank = emp.BankAmount - emp.bank_held - discountPerType;
          const netCash = emp.CashAmount - emp.cash_held - discountPerType;

          const { error: updateAccountError } = await supabase
            .from("employee_account")
            .update({
              bank_balance:
                empAccount.bank_balance + (emp.BankAmount - discountPerType),
              bank_held: empAccount.bank_held + emp.bank_held,
              cash_balance:
                empAccount.cash_balance + (emp.CashAmount - discountPerType),
              cash_held: empAccount.cash_held + emp.cash_held,
            })
            .eq("id", empAccount.id);

          if (updateAccountError) {
            console.error(
              "error updating employee account",
              updateAccountError
            );
            return { success: false, message: "خطأ في تحديث حساب الموظف" };
          }

          // 6.4 Create payroll entries
          // Bank payroll
          if (netBank > 0) {
            const { error: payrollBankError } = await supabase
              .from("payroll")
              .insert({
                employee_id: emp.employee_id,
                pay_date: new Date().toISOString(),
                total_salary: netBank,
                payment_method: "bank",
                status: "pending",
                basic_salary: 0,
                percentage_salary: netBank,
                created_by: user.id,
              });

            if (payrollBankError) {
              console.error("error creating bank payroll", payrollBankError);
              return { success: false, message: "فشل إنشاء قيد الرواتب (بنك)" };
            }
          }

          // Cash payroll
          if (netCash > 0) {
            const { error: payrollCashError } = await supabase
              .from("payroll")
              .insert({
                employee_id: emp.employee_id,
                pay_date: new Date().toISOString(),
                total_salary: netCash,
                payment_method: "cash",
                status: "pending",
                basic_salary: 0,
                percentage_salary: netCash,
                created_by: user.id,
              });

            if (payrollCashError) {
              console.error("error creating cash payroll", payrollCashError);
              return {
                success: false,
                message: "فشل إنشاء قيد الرواتب (نقدي)",
              };
            }
          }
        }
      }

      // 7. Update company accounts
      const companyMainAccount = companyData.find((acc) => acc.type === "main");
      const companyDiscountAccount = companyData.find(
        (acc) => acc.type === "discount"
      );
      const companyHeldAccount = companyData.find((acc) => acc.type === "held");

      // 7.1 Update main company account
      if (companyMainAccount) {
        const { error: updateMainError } = await supabase
          .from("company_account")
          .update({
            bank_balance:
              companyMainAccount.bank_balance + form.company.BankAmount,
            cash_balance:
              companyMainAccount.cash_balance + form.company.CashAmount,
          })
          .eq("id", companyMainAccount.id);

        if (updateMainError) {
          console.error("error updating company main account", updateMainError);
          return {
            success: false,
            message: "خطأ في تحديث حساب الشركة الرئيسي",
          };
        }
      }

      // 7.2 Update discount account
      if (companyDiscountAccount && totalDiscount > 0) {
        const discountPerType = totalDiscount / 2; // Split between cash and bank

        const { error: updateDiscountError } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyDiscountAccount.bank_balance + discountPerType,
            cash_balance: companyDiscountAccount.cash_balance + discountPerType,
          })
          .eq("id", companyDiscountAccount.id);

        if (updateDiscountError) {
          console.error(
            "error updating company discount account",
            updateDiscountError
          );
          return { success: false, message: "خطأ في تحديث حساب خصم الشركة" };
        }

        // Insert company discount record if company has discount
        if (form.company.discount > 0) {
          const { error: insertCompanyDiscountError } = await supabase
            .from("company_discounts")
            .insert({
              period_id: periodData.id,
              amount: form.company.discount,
              note: form.company.note || "",
            });

          if (insertCompanyDiscountError) {
            console.error(
              "error inserting company discount",
              insertCompanyDiscountError
            );
            return { success: false, message: "خطأ في تسجيل خصم الشركة" };
          }
        }
      }

      // 7.3 Update held account
      if (companyHeldAccount && totalHeld > 0) {
        const { error: updateHeldError } = await supabase
          .from("company_account")
          .update({
            bank_balance: companyHeldAccount.bank_balance + totalBankHeld,
            cash_balance: companyHeldAccount.cash_balance + totalCashHeld,
          })
          .eq("id", companyHeldAccount.id);

        if (updateHeldError) {
          console.error("error updating company held account", updateHeldError);
          return {
            success: false,
            message: "خطأ في تحديث حساب المبالغ المحتجزة",
          };
        }
      }

      // 8. Reset project percentage for next period
      const { error: updateProjectError } = await supabase
        .from("project_percentage")
        .update({
          period_percentage: 0,
          period_start: new Date().toISOString().split("T")[0], // Date only
        })
        .eq("project_id", form.project_id);

      if (updateProjectError) {
        console.error("error updating project percentage", updateProjectError);
        return { success: false, message: "خطأ في تحديث نسبة المشروع" };
      }

      return { success: true, message: "تم توزيع النسب بنجاح" };
    } catch (error) {
      console.error("Unexpected error in PercentageDistribution:", error);
      return {
        success: false,
        message: "حدث خطأ غير متوقع أثناء توزيع النسب",
      };
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
        updateProjectBalanceError
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
        mapsDistributionError
      );
      return { success: false, message: "خطأ في إنشاء سجل التوزيع" };
    }

    const companyTotal = form.map.reduce(
      (sum, map) => sum + map.company.amount,
      0
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
          (acc) => acc.id === emp.employee_id
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
                updateAccountError
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
                updateAccountError
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
        updateCompanyAccountError
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
