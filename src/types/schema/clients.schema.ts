import { z } from "zod";

export const ClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string(),
  phone: z.string().optional(),
  password: z.string(),
  company: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  nationality: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
