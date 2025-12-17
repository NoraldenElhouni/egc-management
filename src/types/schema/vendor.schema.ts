import { z } from "zod";

export const vendorsSchema = z.object({
  vendor_name: z.string(),
  contact_name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  phone_number: z.string().min(10),
  alt_phone_number: z.string().min(10).optional(),
  country: z.string(),
  city: z.string(),
  address: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  specialization_id: z.string().min(1),
});

export type VendorFormValues = z.infer<typeof vendorsSchema>;
