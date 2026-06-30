import { z } from "zod";

export const ShopCategorySchema = z.object({
  name: z.string().min(1, "اسم التصنيف مطلوب"),
  description: z.string().nullable().optional(),
  icon_path: z.string().nullable().optional(),
  division_id: z.string().min(1, "القسم مطلوب"),
  is_active: z.boolean().optional(),
});

export type ShopCategoryFormValues = z.infer<typeof ShopCategorySchema>;
