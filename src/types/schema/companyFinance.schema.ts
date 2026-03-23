import { z } from "zod";

export const CompanyExpenseSchema = z.object({
  amount: z.number().min(0.01, "المبلغ يجب ان يكون اكبر من 0"),
  amount_paid: z.number().min(0.01, "المبلغ يجب ان يكون اكبر من 0"),
  payment_method: z.enum(["cash", "bank"], {
    message: "طريقة الدفع غير صالحة",
  }),
  type: z.string().min(1, "اختار نوع المصروف"),
  description: z.string().nullable().optional(),
  expense_date: z.string(),
  reference_id: z.string().nullable().optional(),
});

export type CompanyExpenseFormValues = z.infer<typeof CompanyExpenseSchema>;

export const CompanyExpensePaymentsSchema = z.object({
  expense_id: z.string(),
  amount: z.number().min(0.01, "المبلغ يجب ان يكون اكبر من 0"),
  payment_method: z.enum(["cash", "bank"], {
    message: "طريقة الدفع غير صالحة",
  }),
  date: z.string(),
});

export type CompanyExpensePaymentsValues = z.infer<
  typeof CompanyExpensePaymentsSchema
>;
