import { z } from "zod";

const employeeDistribution = z.object({
  employee_id: z.string(),
  percentage: z.number().min(0).max(100),
  CashAmount: z.number(),
  BankAmount: z.number(),
  cash_held: z.number().min(0),
  bank_held: z.number().min(0),
  discount: z.number().min(0),
  total: z.number(),
  note: z.string(),
});

const companyDistribution = z.object({
  percentage: z.number().min(0).max(100),
  CashAmount: z.number(),
  BankAmount: z.number(),
  cash_held: z.number().min(0),
  bank_held: z.number().min(0),
  discount: z.number().min(0),
  total: z.number(),
  note: z.string(),
});

export const PercentageDistributionSchema = z
  .object({
    project_id: z.string(),
    employee: z.array(employeeDistribution),
    company: companyDistribution,
    total: z.number(),
    log_ids: z.array(z.string()).min(1, "يجب اختيار سجل واحد على الأقل"),
    // Pass the already-computed cash/bank split from the UI directly.
    // The function was re-deriving these from project_percentage.period_percentage
    // which is 0 (not yet updated) — causing "selected > available" false error.
    selected_cash: z.number(),
    selected_bank: z.number(),
  })
  .refine(
    (data) => {
      const employeeTotal = data.employee.reduce(
        (sum, emp) => sum + emp.percentage,
        0,
      );
      const grandTotal = employeeTotal + data.company.percentage;
      return Math.round(grandTotal * 100) / 100 === 100;
    },
    {
      message: "مجموع النسب يجب أن يساوي 100% بالضبط",
      path: ["total"],
    },
  );

export type PercentageDistributionFormValues = z.infer<
  typeof PercentageDistributionSchema
>;
