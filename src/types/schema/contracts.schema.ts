import { z } from "zod";

export const requestItemsSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
  is_custom: z.boolean().optional(), // 👈 new
  custom_name: z.string().optional(), // 👈 new
});

export const requestMilestoneSchema = z.object({
  title: z.string().min(2, "اسم المرحلة مطلوب"),
  description: z.string().optional(),
  percentage: z
    .number()
    .min(1, "النسبة يجب أن تكون أكبر من 0")
    .max(100, "النسبة يجب أن تكون أقل من 100"),
  order_index: z.number(),
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
    milestones: z.array(requestMilestoneSchema), // 👈 new
    status: z.enum(["open", "draft"]),
  })
  .superRefine((data, ctx) => {
    if (data.bid_mode === "direct" && !data.direct_contractor_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار المقاول في حالة العقد المباشر",
        path: ["direct_contractor_id"],
      });
    }
    if (data.status === "draft") return;

    if (data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "يجب إضافة بند واحد على الأقل",
      });
    }

    // validate custom items have a name
    data.items.forEach((item, i) => {
      if (item.is_custom && !item.custom_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", i, "custom_name"],
          message: "اسم البند مطلوب",
        });
      }
    });

    // milestone percentages must sum to 100 (only if milestones exist)
    if (data.milestones.length > 0) {
      const total = data.milestones.reduce(
        (s, m) => s + (m.percentage || 0),
        0,
      );
      if (Math.round(total) !== 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones"],
          message: `مجموع النسب يجب أن يساوي 100% (الحالي: ${total}%)`,
        });
      }
    }
  });

export type RequestForm = z.infer<typeof requestSchemaValues>;
export type RequestMilestone = z.infer<typeof requestMilestoneSchema>;
