import { z } from "zod";

export const ProjectSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Project name is required"),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  percentage: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= 0 && v <= 100), {
      message: "percentage must be between 0 and 100",
    }),
  accounts: z.array(z.enum(["USD", "EUR", "LYD"])),
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;
