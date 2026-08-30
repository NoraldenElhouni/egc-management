import { z } from "zod";

export const ProjectImageSchema = z.object({
  alt_ar: z.string().min(1, "النص البديل بالعربية مطلوب"),
  alt_en: z.string().min(1, "النص البديل بالإنجليزية مطلوب"),
  file: z
    .instanceof(File, { error: "الصورة مطلوبة" })
    .refine((file) => file.size > 0, "الصورة مطلوبة"),
});

export type ProjectImageFormValues = z.infer<typeof ProjectImageSchema>;

export const ProjectImageAltSchema = ProjectImageSchema.omit({ file: true });

export type ProjectImageAltFormValues = z.infer<typeof ProjectImageAltSchema>;
