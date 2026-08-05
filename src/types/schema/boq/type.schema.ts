import { z } from "zod";

export const TypeSchema = z.object({
  name: z.string().min(1, "اسم النوع مطلوب"),
  version: z.number().int("النسخة يجب أن تكون رقم صحيح").min(0, "النسخة يجب أن تكون 0 أو أكثر"),
});

export type TypeFormValues = z.infer<typeof TypeSchema>;
