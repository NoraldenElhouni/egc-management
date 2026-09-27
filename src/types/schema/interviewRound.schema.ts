import { z } from "zod";
import { emptyToUndefined } from "./helper.schema";

export const interviewRoundSchema = z.object({
  interviewType: z.preprocess(
    emptyToUndefined,
    z.enum(["phone", "in_person", "technical", "hr"]).optional(),
  ),
  scheduledAt: z.string().optional(),
  interviewerEmployeeId: z.string().optional(),
  location: z.string().optional(),
});

export type InterviewRoundFormValues = z.infer<typeof interviewRoundSchema>;
