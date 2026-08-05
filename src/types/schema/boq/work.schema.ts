import { z } from "zod";

export const WorkSchema = z.object({
  name: z.string().min(1, "اسم العمل مطلوب"),
});

export type WorkFormValues = z.infer<typeof WorkSchema>;
