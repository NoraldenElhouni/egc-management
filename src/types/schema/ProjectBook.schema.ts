import { z } from "zod";

export const ProjectExpenseSchema = z
  .object({
    project_id: z.string(),
    description: z.string().min(1, "الوصف مطلوب"),
    type: z.enum(["labor", "material"], {
      message: "نوع المصروف يجب أن يكون إما 'اعمال' أو 'مواد'",
    }),
    phase: z.enum(["construction", "finishing"], {
      message: "المرحلة يجب أن تكون إما 'انشاء' أو 'تشطيب'",
    }),
    total_amount: z.number().min(0, "القيمة يجب أن تكون غير سالبة").default(0),
    paid_amount: z
      .number()
      .min(0, "القيمة المدفوعة يجب أن تكون غير سالبة")
      .default(0),
    payment_method: z.enum(["cash", "cheque", "transfer", "deposit"], {
      message: "طريقة الدفع غير صالحة",
    }),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "التاريخ غير صالح",
    }),
    Currency: z.enum(["LYD", "USD", "EUR"], {
      message: "العملة غير صالحة",
    }),
  })
  .refine((data) => data.paid_amount <= data.total_amount, {
    message: "القيمة المدفوعة لا يمكن أن تتجاوز القيمة الإجمالية",
    path: ["paid_amount"],
  });

export const ProjectIncomeSchema = z.object({
  project_id: z.string(),
  description: z.string().nullable(),
  amount: z.number().min(0, "المبلغ يجب أن يكون غير سالب"),
  fund: z.enum(["client", "internal", "sale", "refund", "other"], {
    message: "مصدر التمويل غير صالح",
  }),
  payment_method: z.enum(["cash", "cheque", "transfer", "deposit"], {
    message: "طريقة الدفع غير صالحة",
  }),
  income_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "التاريخ غير صالح",
  }),
  // related_expense: z.string().nullable(),
});

export type ProjectIncomeFormValues = z.infer<typeof ProjectIncomeSchema>;

export type ProjectExpenseFormValues = z.infer<typeof ProjectExpenseSchema>;
