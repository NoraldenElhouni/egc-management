import { z } from "zod";

export const NewProjectSchema = z.object({
  category_id: z.string().min(1, "التصنيف مطلوب"),
  title_ar: z.string().min(1, "العنوان بالعربية مطلوب"),
  title_en: z.string().min(1, "العنوان بالإنجليزية مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  client_ar: z.string().optional(),
  client_en: z.string().optional(),
  location_ar: z.string().optional(),
  location_en: z.string().optional(),
  status_ar: z.string().optional(),
  status_en: z.string().optional(),
  year: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export type NewProjectFormValues = z.infer<typeof NewProjectSchema>;
