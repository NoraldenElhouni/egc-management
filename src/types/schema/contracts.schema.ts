import { z } from "zod";

export const roundItemSchema = z.object({
  work_id: z.string().uuid(),
  boq_item_id: z.string().uuid().nullable(),
  name: z.string().min(1, "اسم البند مطلوب"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  quantity: z.number().positive("الكمية يجب أن تكون أكبر من 0"),
});

export const roundSchemaValues = z.object({
  specialization_id: z.string().uuid("التخصص مطلوب").nullable().optional(),
  title: z.string().min(3, "العنوان مطلوب"),
  notes: z.string().optional(),
  items: z.array(roundItemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
});

export type RoundForm = z.infer<typeof roundSchemaValues>;
export type RoundItemForm = z.infer<typeof roundItemSchema>;
