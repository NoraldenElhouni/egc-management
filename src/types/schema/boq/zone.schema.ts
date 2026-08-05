import { z } from "zod";

export const ZoneSchema = z.object({
  name: z.string().min(1, "اسم المنطقة مطلوب"),
});

export type ZoneFormValues = z.infer<typeof ZoneSchema>;
