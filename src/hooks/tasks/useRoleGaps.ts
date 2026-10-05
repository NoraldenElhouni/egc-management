import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// Before a template is applied or pushed: which of the project roles its
// tasks use (tasks.task_role_assignees) are held by somebody on each
// target board's project (public.team_assignments), and which are empty.
// Filled roles need nothing — tasks._assign_roles assigns their holders.
// Empty ones become "gaps" the dialog asks about (RoleGapsSection.tsx).
//
// Boards are grouped by project, since roles belong to a project, not a
// board: three zone boards of one project share one gap. A board whose
// space has no project (company/department spaces) is its own group, and
// every role is empty there.

export interface RoleGap {
  /** groupKey + ":" + roleId — stable key for the dialog's choices. */
  key: string;
  groupKey: string;
  projectId: string | null;
  /** project name, or the board's name when it has no project */
  label: string;
  boardIds: string[];
  roleId: string;
  roleName: string;
  taskCount: number;
}

export interface FilledRole {
  label: string;
  roleName: string;
  holderNames: string[];
}

interface RoleGapsResult {
  gaps: RoleGap[];
  filled: FilledRole[];
}

export function useRoleGaps(templateTaskIds: string[], targetBoardIds: string[]) {
  const taskKey = [...templateTaskIds].sort().join(",");
  const boardKey = [...targetBoardIds].sort().join(",");

  const query = useQuery({
    queryKey: ["role-gaps", taskKey, boardKey],
    enabled: templateTaskIds.length > 0 && targetBoardIds.length > 0,
    queryFn: async (): Promise<RoleGapsResult> => {
      const tasksDb = supabase.schema("tasks");

      const { data: roleRows, error: roleError } = await tasksDb
        .from("task_role_assignees")
        .select("task_id, project_role_id")
        .in("task_id", templateTaskIds);
      if (roleError) throw roleError;
      if (!roleRows || roleRows.length === 0) return { gaps: [], filled: [] };

      const taskCountByRole = new Map<string, number>();
      for (const row of roleRows) {
        taskCountByRole.set(row.project_role_id, (taskCountByRole.get(row.project_role_id) ?? 0) + 1);
      }
      const roleIds = Array.from(taskCountByRole.keys());

      const [{ data: roleNameRows, error: roleNamesError }, { data: boards, error: boardsError }] = await Promise.all([
        supabase.from("project_roles").select("id, name").in("id", roleIds),
        tasksDb.from("boards").select("id, name, space_id").in("id", targetBoardIds),
      ]);
      if (roleNamesError) throw roleNamesError;
      if (boardsError) throw boardsError;
      const roleNameById = new Map((roleNameRows ?? []).map((r) => [r.id, r.name]));

      const spaceIds = Array.from(new Set((boards ?? []).map((b) => b.space_id)));
      const { data: spaces, error: spacesError } = await tasksDb.from("spaces").select("id, project_id").in("id", spaceIds);
      if (spacesError) throw spacesError;
      const projectBySpace = new Map((spaces ?? []).map((s) => [s.id, s.project_id]));
      const projectIds = Array.from(new Set((spaces ?? []).map((s) => s.project_id).filter(Boolean))) as string[];

      const [{ data: projects, error: projectsError }, { data: holders, error: holdersError }] = await Promise.all([
        projectIds.length
          ? supabase.from("projects").select("id, name").in("id", projectIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
        projectIds.length
          ? supabase
              .from("team_assignments")
              .select("project_id, project_role_id, person_id")
              .in("project_id", projectIds)
              .in("project_role_id", roleIds)
          : Promise.resolve({ data: [] as { project_id: string; project_role_id: string; person_id: string }[], error: null }),
      ]);
      if (projectsError) throw projectsError;
      if (holdersError) throw holdersError;
      const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

      const personIds = Array.from(new Set((holders ?? []).map((h) => h.person_id)));
      const { data: people, error: peopleError } = personIds.length
        ? await supabase.from("users").select("id, first_name, last_name").in("id", personIds)
        : { data: [] as { id: string; first_name: string | null; last_name: string | null }[], error: null };
      if (peopleError) throw peopleError;
      const personNameById = new Map(
        (people ?? []).map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"]),
      );

      const holdersByProjectRole = new Map<string, string[]>();
      for (const h of holders ?? []) {
        const key = `${h.project_id}:${h.project_role_id}`;
        const list = holdersByProjectRole.get(key) ?? [];
        list.push(h.person_id);
        holdersByProjectRole.set(key, list);
      }

      // one group per project; a board without a project is its own group
      const groups = new Map<string, { projectId: string | null; label: string; boardIds: string[] }>();
      for (const b of boards ?? []) {
        const projectId = projectBySpace.get(b.space_id) ?? null;
        const groupKey = projectId ?? `board:${b.id}`;
        const group = groups.get(groupKey) ?? {
          projectId,
          label: projectId ? (projectNameById.get(projectId) ?? b.name) : b.name,
          boardIds: [],
        };
        group.boardIds.push(b.id);
        groups.set(groupKey, group);
      }

      const gaps: RoleGap[] = [];
      const filled: FilledRole[] = [];
      for (const [groupKey, group] of groups) {
        for (const roleId of roleIds) {
          const roleName = roleNameById.get(roleId) ?? "—";
          const holderIds = group.projectId ? (holdersByProjectRole.get(`${group.projectId}:${roleId}`) ?? []) : [];
          if (holderIds.length > 0) {
            filled.push({
              label: group.label,
              roleName,
              holderNames: Array.from(new Set(holderIds)).map((id) => personNameById.get(id) ?? "—"),
            });
          } else {
            gaps.push({
              key: `${groupKey}:${roleId}`,
              groupKey,
              projectId: group.projectId,
              label: group.label,
              boardIds: group.boardIds,
              roleId,
              roleName,
              taskCount: taskCountByRole.get(roleId) ?? 0,
            });
          }
        }
      }

      return { gaps, filled };
    },
  });

  return {
    gaps: query.data?.gaps ?? [],
    filled: query.data?.filled ?? [],
    loading: query.isFetching,
    error: query.error,
  };
}
