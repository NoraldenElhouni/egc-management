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
  note: z.string().optional(),
});

const companyDistribution = z.object({
  percentage: z.number().min(0).max(100),
  CashAmount: z.number(),
  BankAmount: z.number(),
  cash_held: z.number().min(0),
  bank_held: z.number().min(0),
  discount: z.number().min(0),
  total: z.number(),
  note: z.string().optional(),
});

export const PercentageDistributionSchema = z
  .object({
    project_id: z.string(),
    employee: z.array(employeeDistribution),
    company: companyDistribution,
    total: z.number(),
  })
  .refine(
    (data) => {
      const employeeTotal = data.employee.reduce(
        (sum, emp) => sum + emp.percentage,
        0
      );
      const grandTotal = employeeTotal + data.company.percentage;
      return grandTotal <= 100;
    },
    {
      message: "إجمالي النسب يجب ألا يتجاوز 100%",
      path: ["total"],
    }
  );

export type PercentageDistributionFormValues = z.infer<
  typeof PercentageDistributionSchema
>;
