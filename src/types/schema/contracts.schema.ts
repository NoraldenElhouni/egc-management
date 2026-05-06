import { z } from "zod";

export const contractItemsSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
});

export const contractSchema = z.object({
  specialization_id: z.string().uuid("التخصص مطلوب"),
  title: z.string().min(3, "العنوان مطلوب"),
  description: z.string().min(10, "الوصف مطلوب"),
  bid_deadline: z.string(),
  bid_mode: z.enum(["open", "direct"]),
  items: z.array(contractItemsSchema).min(1, "يجب إضافة بند واحد على الأقل"),
});

export type ContractForm = z.infer<typeof contractSchema>;
