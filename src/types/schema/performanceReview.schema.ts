import { z } from "zod";
import { emptyToUndefined } from "./helper.schema";

export const performanceReviewSchema = z.object({
  overallRecommendation: z.preprocess(
    emptyToUndefined,
    z.enum(["promote", "maintain", "improve", "terminate"]).optional(),
  ),
  overallNotes: z.string().optional(),
});

export type PerformanceReviewFormValues = z.infer<
  typeof performanceReviewSchema
>;
