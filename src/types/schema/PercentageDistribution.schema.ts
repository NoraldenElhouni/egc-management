import { z } from "zod";

export const PercentageDistributionSchema = z.object({
  project_id: z.string(),
  period_percentage: z.number().min(0, "Period percentage must be >= 0"),
  employees: z
    .array(
      z.object({
        id: z.string(),
        amount: z.number().min(0, "Amount must be >= 0"),
      })
    )
    .min(1, "At least one employee is required"),
  company: z.object({
    amount: z.number().min(0, "Amount must be >= 0"),
  }),
});

export type PercentageDistributionFormValues = z.infer<
  typeof PercentageDistributionSchema
>;
