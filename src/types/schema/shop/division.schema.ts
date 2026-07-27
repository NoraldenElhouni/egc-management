import { z } from "zod";

export const ShopDivisionSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  specialization_id: z.string().nullable().optional(),
  expense_id: z.string().nullable().optional(),
  icon_path: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type ShopDivisionFormValues = z.infer<typeof ShopDivisionSchema>;
