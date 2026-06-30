import { z } from "zod";

export const ShopSubcategorySchema = z.object({
  name: z.string().min(1, "اسم التصنيف الفرعي مطلوب"),
  description: z.string().nullable().optional(),
  category_id: z.string().min(1, "التصنيف الرئيسي مطلوب"),
  is_active: z.boolean().optional(),
});

export type ShopSubcategoryFormValues = z.infer<typeof ShopSubcategorySchema>;
