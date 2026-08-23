import { z } from "zod";

export const ProjectSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  name: z.string().trim().min(1, "Project name is required"),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  percentage: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= 0 && v <= 100), {
      message: "percentage must be between 0 and 100",
    }),
  latitude: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= -90 && v <= 90), {
      message: "latitude must be between -90 and 90",
    }),
  longitude: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= -180 && v <= 180), {
      message: "longitude must be between -180 and 180",
    }),
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;

export const ProjectStatusValues = [
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export const ProjectEditSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  name: z.string().trim().min(1, "Project name is required"),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(ProjectStatusValues),
  latitude: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= -90 && v <= 90), {
      message: "latitude must be between -90 and 90",
    }),
  longitude: z
    .number()
    .nullable()
    .optional()
    .refine((v) => v == null || (v >= -180 && v <= 180), {
      message: "longitude must be between -180 and 180",
    }),
});

export type ProjectEditFormValues = z.infer<typeof ProjectEditSchema>;
