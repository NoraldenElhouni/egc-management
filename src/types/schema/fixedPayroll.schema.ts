import { z } from "zod";

export const FixedEmployeesPayrollSchema = z.object({
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.number().nonnegative(),
    })
  ),
});

export type FixedPayrollFormValues = z.infer<
  typeof FixedEmployeesPayrollSchema
>;
