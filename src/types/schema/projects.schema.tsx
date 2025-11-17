import { z } from "zod";

export const ProjectSchema = z.object({
  client_id: z.string(),
  name: z.string().min(1, "Project name is required"),
  address: z.string().nullable().optional(),
  status: z
    .enum(["active", "paused", "completed", "cancelled"])
    .default("active"),
  description: z.string().nullable().optional(),

  percentage: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= 0 && v <= 100), {
      message: "percentage must be between 0 and 100",
    }),
  serial_number: z.number().int().nullable().optional(),
  accounts: z.array(z.enum(["USD", "EUR", "LYD"])).optional(),
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;
