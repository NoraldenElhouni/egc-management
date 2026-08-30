import { z } from "zod";

export const HeroSlideSchema = z.object({
  alt_ar: z.string().min(1, "النص البديل بالعربية مطلوب"),
  alt_en: z.string().min(1, "النص البديل بالإنجليزية مطلوب"),
  file: z
    .instanceof(File, { error: "الصورة مطلوبة" })
    .refine((file) => file.size > 0, "الصورة مطلوبة"),
});

export type HeroSlideFormValues = z.infer<typeof HeroSlideSchema>;

export const HeroSlideAltSchema = HeroSlideSchema.omit({ file: true });

export type HeroSlideAltFormValues = z.infer<typeof HeroSlideAltSchema>;
