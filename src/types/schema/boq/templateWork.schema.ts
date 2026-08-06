import { z } from "zod";

export const TemplateWorkSchema = z.object({
  name: z.string().min(1, "اسم العمل مطلوب"),
});

export type TemplateWorkFormValues = z.infer<typeof TemplateWorkSchema>;
