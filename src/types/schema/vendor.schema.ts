import { z } from "zod";

export const vendorsSchema = z.object({
  vendor_name: z.string().min(1, "اسم المورد مطلوب"),

  specialization_id: z.string().min(1, "التخصص مطلوب"),

  contact_name: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
  password: z.string().optional().or(z.literal("")),

  phone_number: z.string().optional().or(z.literal("")),
  alt_phone_number: z.string().optional().or(z.literal("")),

  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type VendorFormValues = z.infer<typeof vendorsSchema>;
