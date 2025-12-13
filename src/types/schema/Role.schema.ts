import { z } from "zod";

export const RoleSchema = z.object({
  name: z.string().min(4, "الاسم يجب ان يكون اكثر من 4 حروف"),
  code: z.string().min(2, "الكود يجب ان يكون اكثر من 2 حروف"),
});

export type RoleFormValues = z.infer<typeof RoleSchema>;
