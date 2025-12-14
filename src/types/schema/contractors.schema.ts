import { z } from "zod";

export const ContractorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),

  // multi-select
  specializationId: z.string(),

  // optional UI fields (only if you store them)
  nationality: z.string().optional(),
});

export type ContractorFormValues = z.infer<typeof ContractorSchema>;
