import { z } from "zod";
import { emptyToUndefined } from "./helper.schema";
import { optionalNumber } from "../../utils/zodHelpers";

export const applicantSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم الكامل مطلوب"),
  gender: z.enum(["male", "female"], {
    message: "الجنس مطلوب",
  }),
  birthDate: z.string().optional(),
  phoneWhatsapp: z.string().trim().min(8, "رقم الهاتف مطلوب"),
  specialization: z.string().optional(),
  university: z.string().optional(),
  gpaGrade: z.string().optional(),
  graduationYear: optionalNumber({ min: 1950, max: 2100 }),
  jobRequestId: z.string().min(1, "يجب اختيار وظيفة شاغرة"),
  experienceLevel: z.preprocess(
    emptyToUndefined,
    z.enum(["none", "1_3", "3_5", "5_plus"]).optional(),
  ),
  currentEmploymentStatus: z.preprocess(
    emptyToUndefined,
    z.enum(["not_working", "working"]).optional(),
  ),
  applicationSource: z.string().optional(),
  generalNotes: z.string().optional(),
});

export type ApplicantFormValues = z.infer<typeof applicantSchema>;
