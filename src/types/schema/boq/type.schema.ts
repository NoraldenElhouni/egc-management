import { z } from "zod";

export const TypeSchema = z.object({
  name: z.string().min(1, "اسم النوع مطلوب"),
});

export type TypeFormValues = z.infer<typeof TypeSchema>;
