import { z } from "zod";

export const CreateTypeFromTemplateSchema = z
  .object({
    template_type_id: z.string().min(1, "اختر القالب"),
    version: z
      .number()
      .int("النسخة يجب أن تكون رقم صحيح")
      .min(0, "النسخة يجب أن تكون 0 أو أكثر"),
    use_template: z.boolean(),
    zone_ids: z.array(z.string()),
    template_work_ids: z.array(z.string()),
    template_item_ids: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.use_template && data.zone_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zone_ids"],
        message: "اختر منطقة واحدة على الأقل",
      });
    }
  });

export type CreateTypeFromTemplateFormValues = z.infer<
  typeof CreateTypeFromTemplateSchema
>;
