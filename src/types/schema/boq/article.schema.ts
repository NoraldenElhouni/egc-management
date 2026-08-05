import { z } from "zod";

export const ArticleSchema = z.object({
  name: z.string().min(1, "اسم الفصل مطلوب"),
});

export type ArticleFormValues = z.infer<typeof ArticleSchema>;
