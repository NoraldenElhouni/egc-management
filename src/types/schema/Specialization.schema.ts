import { z } from "zod";

export const SpecializationUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "الاسم مطلوب").max(100, "الاسم طويل جداً"),
});

export type SpecializationUpdateValues = z.infer<
  typeof SpecializationUpdateSchema
>;
