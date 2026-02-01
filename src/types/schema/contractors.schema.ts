import { z } from "zod";

export const ContractorSchema = z.object({
  // required
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب"),
  specializationId: z.string().min(1, "التخصص مطلوب"),

  // optional (validate only when not empty)
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "رقم الهاتف يجب أن يكون على الأقل 10 أرقام")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون على الأقل 8 أحرف")
    .optional()
    .or(z.literal("")),

  nationality: z.string().optional().or(z.literal("")),
});

export type ContractorFormValues = z.infer<typeof ContractorSchema>;
