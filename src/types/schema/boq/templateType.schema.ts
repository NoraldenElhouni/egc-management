import { z } from "zod";

export const TemplateTypeSchema = z.object({
  name: z.string().min(1, "اسم النوع مطلوب"),
});

export type TemplateTypeFormValues = z.infer<typeof TemplateTypeSchema>;
