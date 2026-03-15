import { z } from "zod";

export const CompanyExpenseSchema = z.object({
  amount: z.number().min(0.01, "المبلغ يجب ان يكون اكبر من 0"),
  type: z.string().min(1, "اختار نوع المصروف"),
  description: z.string().nullable().optional(),
  expense_date: z.string(),
  reference_id: z.string().nullable().optional(),
});

export type CompanyExpenseFormValues = z.infer<typeof CompanyExpenseSchema>;
