import { z } from "zod";

const optionalPrice = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = typeof val === "number" ? val : Number(val);
  return Number.isNaN(num) ? null : num;
}, z.number().min(0, "السعر يجب ان يكون 0 أو أكثر").nullable());

export const ItemSchema = z.object({
  name: z.string().min(1, "اسم البند مطلوب"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من صفر"),
  unit_price: optionalPrice,
});

export type ItemFormValues = z.infer<typeof ItemSchema>;
