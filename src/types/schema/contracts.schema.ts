import { z } from "zod";

export const requestItemsSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
});

export const requestSchemaValues = z
  .object({
    specialization_id: z.string().uuid("التخصص مطلوب"),
    title: z.string().min(3, "العنوان مطلوب"),
    description: z.string().min(4, "الوصف مطلوب"),
    bid_deadline: z.string(),
    work_start_at: z.string(),
    bid_mode: z.enum(["open", "direct"]),
    direct_contractor_id: z.string().uuid().nullable().optional(),
    contact_name: z.string(),
    contact_phone: z.string(),
    delay_penalty_terms: z.string(),
    retention_terms: z.string(),
    contractor_provides_materials: z.boolean(),
    items: z.array(requestItemsSchema),
    status: z.enum(["open", "draft"]),
  })
  .superRefine((data, ctx) => {
    // 👇 if mode is direct, contractor_id is required
    if (data.bid_mode === "direct" && !data.direct_contractor_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار المقاول في حالة العقد المباشر",
        path: ["direct_contractor_id"],
      });
    }
    if (data.status === "draft") return;

    // open → must have items
    if (data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "يجب إضافة بند واحد على الأقل",
      });
    }
  });

export type RequestForm = z.infer<typeof requestSchemaValues>;
