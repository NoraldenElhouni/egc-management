import { z } from "zod";

export const FixedEmployeesPayrollSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.number().nonnegative(),
    }),
  ),
});

export type FixedPayrollFormValues = z.infer<
  typeof FixedEmployeesPayrollSchema
>;
