import { z } from "zod";

const BreakdownSchema = z.object({
  percentage: z
    .number()
    .min(0, "النسبة يجب أن تكون 0 أو أكثر")
    .max(100, "النسبة يجب ألا تتجاوز 100"),
  amount: z.number().min(0, "المبلغ يجب أن يكون 0 أو أكثر"),
  held: z.number().min(0, "المبلغ الموقوف يجب أن يكون 0 أو أكثر"),
  discount: z.number().min(0, "الخصم يجب أن يكون 0 أو أكثر"),
  note: z
    .string()
    .max(500, "الملاحظة يجب ألا تتجاوز 500 حرف")
    .optional()
    .or(z.literal("")),
});

const EmployeeDistributionSchema = z.object({
  id: z.string(),
  bank: BreakdownSchema,
  cash: BreakdownSchema,
  note: z
    .string()
    .max(500, "الملاحظة يجب ألا تتجاوز 500 حرف")
    .optional()
    .or(z.literal("")),
});

export const PercentageDistributionSchema = z.object({
  project_id: z.string(),
  totals: z.object({
    bank: z.number().min(0, "إجمالي البنك يجب أن يكون 0 أو أكثر"),
    cash: z.number().min(0, "إجمالي النقد يجب أن يكون 0 أو أكثر"),
  }),
  employees: z
    .array(EmployeeDistributionSchema)
    .min(1, "يجب اختيار موظف واحد على الأقل"),
  company: z.object({
    bank: z.number().min(0, "حصة الشركة (بنك) يجب أن تكون 0 أو أكثر"),
    cash: z.number().min(0, "حصة الشركة (نقد) يجب أن تكون 0 أو أكثر"),
  }),
});

export type PercentageDistributionFormValues = z.infer<
  typeof PercentageDistributionSchema
>;
