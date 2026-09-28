import { z } from "zod";
import { emptyToUndefined } from "./helper.schema";

const questionTypeEnum = z.enum(
  [
    "text",
    "textarea",
    "number",
    "single_choice",
    "multi_choice",
    "checkbox",
    "rating",
    "yes_no",
  ],
  { message: "نوع السؤال مطلوب" },
);

/** Shared header fields for a question bank entry and a job-request question. */
export const questionSchema = z.object({
  department: z.preprocess(emptyToUndefined, z.string().optional()),
  questionText: z.string().trim().min(1, "نص السؤال مطلوب"),
  questionType: questionTypeEnum,
  isRequired: z.boolean().default(true),
});

export type QuestionFormValues = z.infer<typeof questionSchema>;
