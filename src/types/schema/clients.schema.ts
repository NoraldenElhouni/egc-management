import { z } from "zod";

export const ClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  company: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  nationality: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
