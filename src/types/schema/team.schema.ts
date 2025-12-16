import { z } from "zod";

export const TeamEmployeeSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
  percentage: z
    .number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage cannot exceed 100"),
  project_id: z.string().min(1, "Project ID is required"),
});

export type TeamEmployeeValue = z.infer<typeof TeamEmployeeSchema>;
