import { z } from "zod";

export const ProjectUserPermissionsSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  project_id: z.string().min(1, "Project ID is required"),
  permission_id: z.string().min(1, "Permission ID is required"),
});
export type ProjectUserPermissionsValue = z.infer<
  typeof ProjectUserPermissionsSchema
>;
