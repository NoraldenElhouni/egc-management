import { z } from "zod";

export const ProjectExpenseSchema = z
  .object({
    project_id: z.string(),
    description: z.string().min(1, "الوصف مطلوب"),
    expense_id: z.string().optional(),

    type: z.enum(["labor", "material"], {
      message: "نوع المصروف يجب أن يكون إما 'اعمال' أو 'مواد'",
    }),
    contractor_id: z.string().optional(),
    vendor_id: z.string().optional(),
    phase: z.enum(["construction", "finishing"], {
      message: "المرحلة يجب أن تكون إما 'انشاء' أو 'تشطيب'",
    }),
    total_amount: z.number().min(0, "القيمة يجب أن تكون غير سالبة").default(0),
    paid_amount: z
      .number()
      .min(0, "القيمة المدفوعة يجب أن تكون غير سالبة")
      .default(0),
    payment_method: z.enum(["cash", "bank"], {
      message: "طريقة الدفع غير صالحة",
    }),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "التاريخ غير صالح",
    }),
    currency: z.enum(["LYD", "USD", "EUR"], {
      message: "العملة غير صالحة",
    }),
  })
  .refine((data) => (data.type === "labor" ? !!data.contractor_id : true), {
    message: "يجب اختيار مقاول للأعمال",
    path: ["contractor_id"],
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
  payment_method: z.enum(["cash", "bank"], {
    message: "طريقة الدفع غير صالحة",
  }),
  income_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "التاريخ غير صالح",
  }),
  currency: z.enum(["LYD", "USD", "EUR"]),
  client_name: z.string(),
  // related_expense: z.string().nullable(),
});

export const ExpensePaymentSchema = (
  accounts: { id: string; currency: "LYD" | "USD" | "EUR" }[],
  remaining = Number.MAX_SAFE_INTEGER
) =>
  z
    .object({
      expenseId: z.string(),
      amount: z
        .number({ error: "المبلغ مطلوب" })
        .positive("المبلغ يجب أن يكون أكبر من صفر")
        .max(remaining, "المبلغ يتجاوز المتبقي"),
      currency: z.enum(["LYD", "USD", "EUR"], {
        message: "العملة غير صالحة",
      }),
      account_id: z.string().min(1, "اختر حساباً"),
    })
    .refine(
      (vals) => {
        // Ensure selected account matches selected currency
        const acc = accounts.find((a) => a.id === vals.account_id);
        if (!acc) return false;
        return acc.currency === vals.currency;
      },
      { message: "الحساب لا يطابق العملة المختارة", path: ["account_id"] }
    );

export const projectRefundSchema = z.object({
  project_id: z.string().uuid(),
  description: z.string().nullable(),
  amount: z.number().positive(),
  payment_method: z.enum(["cash", "bank", "cheque", "deposit"]),
  income_date: z.string(),
  currency: z.enum(["LYD", "USD", "EUR"]),
});

export type ProjectRefundValues = z.infer<typeof projectRefundSchema>;

export type ExpensePaymentFormValues = z.infer<
  ReturnType<typeof ExpensePaymentSchema>
>;

export type ProjectIncomeFormValues = z.infer<typeof ProjectIncomeSchema>;

export type ProjectExpenseFormValues = z.infer<typeof ProjectExpenseSchema>;
