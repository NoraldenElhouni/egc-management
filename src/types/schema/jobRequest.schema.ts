import { z } from "zod";
import { optionalNumber } from "../../utils/zodHelpers";

export const jobRequestSchema = z.object({
  positionTitle: z.string().trim().min(1, "مسمى الوظيفة مطلوب"),
  department: z.string().optional(),
  positionsCount: optionalNumber({ min: 1 }),
  justification: z.string().optional(),
});

export type JobRequestFormValues = z.infer<typeof jobRequestSchema>;
