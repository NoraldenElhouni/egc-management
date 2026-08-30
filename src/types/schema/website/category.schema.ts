import { z } from "zod";

export const CategorySchema = z.object({
  name_ar: z.string().min(1, "الاسم بالعربية مطلوب"),
  name_en: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
});

export type CategoryFormValues = z.infer<typeof CategorySchema>;
