import { useQuery } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import { projectTeamKey } from "../team/useTeamAssignments";

/**
 * Distinct people on a project's team (public.team_assignments), as a Set of
 * employee ids — the same ids as AssignablePerson.id / task_assignees.user_id.
 *
 * Used by the assignee picker to float project members above everyone else.
 * Someone holding two roles on a project has two rows, hence the Set.
 *
 * Keyed under projectTeamKey(projectId) so every team add/change/remove
 * (useTeamAssignments.ts) invalidates it by prefix. `enabled` lets the picker
 * fetch only once its popover is open instead of once per board row.
 */
export function useProjectMemberIds(projectId: string | null | undefined, enabled = true) {
  return useQuery<Set<string>>({
    queryKey: [...projectTeamKey(projectId ?? "none"), "member-ids"],
    enabled: Boolean(projectId) && enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await permissionsDb
        .from("team_assignments")
        .select("person_id")
        .eq("project_id", projectId as string);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.person_id));
    },
  });
}
