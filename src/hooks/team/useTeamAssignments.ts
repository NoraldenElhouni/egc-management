import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import { supabase } from "../../lib/supabaseClient";
import type { ProjectRoleRow } from "../../types/permissions.types";

// =====================================================================
// PROJECT TEAM — reads and writes team_assignments
// =====================================================================
//
// Implementation guide section 4.4 and section 2.2.
//
// team_assignments is the only table this file touches. It used to also
// dual-write project_assignments so nothing reading the old table went
// stale during the migration — issue #18 retired that mirror: the app
// no longer reads or writes project_assignments anywhere, so there is
// nothing left to keep in step with it.
//
// WHAT THIS FILE DELIBERATELY DOES NOT DO
//   - No percentage, anywhere. Distribution is a separate table, a
//     separate screen and a separate Phase (5). A person can be on the
//     team with no share and hold a share without being on the team;
//     neither is an error and neither is inferred from the other.
//   - No cardinality rules. Unlimited people per project role, all
//     equals, no lead/assistant concept. Nothing here counts PMs.
// =====================================================================

export const projectTeamKey = (projectId: string) => ["project-team", projectId];
export const PROJECT_ROLES_KEY = ["project-roles"];
export const assignableStaffKey = ["team-assignable-staff"];

export interface TeamMember {
  /** team_assignments.id — the row, not the person. */
  assignmentId: string;
  personId: string;
  fullName: string;
  email: string | null;
  projectRoleId: string;
  projectRoleName: string;
  assignedAt: string;
}

/**
 * Everyone on a project's team.
 *
 * Returns one entry per ASSIGNMENT, not per person. Someone holding two
 * project roles on one project appears twice, which is correct — they
 * really are doing two jobs on it. Callers that want distinct people
 * must dedupe on personId themselves rather than assuming uniqueness.
 */
export function useProjectTeam(projectId: string | undefined) {
  return useQuery<TeamMember[]>({
    queryKey: projectTeamKey(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data: rows, error } = await permissionsDb
        .from("team_assignments")
        .select("id, person_id, project_role_id, assigned_at")
        .eq("project_id", projectId as string);
      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      // Joined in JS rather than with a PostgREST embed: team_assignments
      // is hand-typed (see permissions.types.ts) with no Relationships,
      // so embeds would not typecheck. Two extra round trips on a table
      // that holds a handful of rows per project is a fair trade.
      const personIds = Array.from(new Set(rows.map((r) => r.person_id)));
      const roleIds = Array.from(new Set(rows.map((r) => r.project_role_id)));

      const [{ data: users }, { data: roles }] = await Promise.all([
        supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("id", personIds),
        permissionsDb.from("project_roles").select("id, name").in("id", roleIds),
      ]);

      const userById = new Map((users ?? []).map((u) => [u.id, u]));
      const roleById = new Map((roles ?? []).map((r) => [r.id, r.name]));

      return rows
        .map((row) => {
          const user = userById.get(row.person_id);
          return {
            assignmentId: row.id,
            personId: row.person_id,
            fullName:
              `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "—",
            email: user?.email ?? null,
            projectRoleId: row.project_role_id,
            projectRoleName: roleById.get(row.project_role_id) ?? "—",
            assignedAt: row.assigned_at,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
      // Sorted alphabetically ON PURPOSE. Any ordering that reflects
      // seniority, date added, or "who was here first" would imply a
      // hierarchy this model does not have.
    },
  });
}

export function useProjectRoles() {
  return useQuery<ProjectRoleRow[]>({
    queryKey: PROJECT_ROLES_KEY,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await permissionsDb
        .from("project_roles")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AssignablePerson {
  id: string;
  fullName: string;
  email: string | null;
}

/**
 * Who may be put on a project team.
 *
 * Company accounts only. Contractors, vendors and clients are excluded —
 * confirmed decision (guide section 7, decision 9): they participate in
 * projects through the contracts and bids subsystem, never as team
 * members. Two filters enforce it, deliberately overlapping:
 *   - an employees row must exist (team_assignments.person_id is FK'd to
 *     employees, so the database would reject anyone else anyway)
 *   - users.party_type must be 'company'
 * The second is redundant today and will stop being redundant the moment
 * anyone gives a vendor an employees row by mistake.
 */
export function useAssignableStaffForTeam() {
  return useQuery<AssignablePerson[]>({
    queryKey: assignableStaffKey,
    queryFn: async () => {
      const { data: employees, error } = await permissionsDb
        .from("employees")
        .select("id");
      if (error) throw error;
      if (!employees || employees.length === 0) return [];

      // Through permissionsDb because party_type is a Phase 1 column
      // that the generated types do not know about yet.
      const { data: users, error: usersError } = await permissionsDb
        .from("users")
        .select("id, first_name, last_name, email, party_type")
        .in(
          "id",
          employees.map((e) => e.id),
        )
        .eq("party_type", "company");
      if (usersError) throw usersError;

      return (users ?? [])
        .map((u) => ({
          id: u.id,
          fullName: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—",
          email: u.email,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    },
  });
}

// ---------------------------------------------------------------------
// WRITES — team_assignments only
// ---------------------------------------------------------------------
//
// Issue #18: this used to dual-write project_assignments too, with a
// compensating rollback for when the second write failed. That mirror
// is gone — team_assignments is the only table a team-membership change
// touches now, so there is nothing left to keep in step and nothing to
// roll back.
//
// percentage is NEVER touched here, in either direction. A person can be
// on the team with no share and hold a share without being on the team;
// neither is an error and neither is inferred from the other. Their
// project_distributions row (Phase 5) is a different table entirely.

interface AddArgs {
  projectId: string;
  personId: string;
  projectRoleId: string;
  /** users.id of whoever is making the change. */
  assignedBy: string | null;
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      personId,
      projectRoleId,
      assignedBy,
    }: AddArgs) => {
      const { data: created, error } = await permissionsDb
        .from("team_assignments")
        .insert({
          project_id: projectId,
          person_id: personId,
          project_role_id: projectRoleId,
          assigned_by: assignedBy,
        })
        .select("id")
        .single();

      if (error) {
        // 23505 = unique_violation. Phase 1's
        // UNIQUE (project_id, person_id, project_role_id).
        if ((error as { code?: string }).code === "23505") {
          throw new Error(
            "هذا الشخص مضاف بالفعل إلى هذا المشروع بنفس الدور. يمكن إضافته بدور مختلف.",
          );
        }
        throw error;
      }

      return created.id;
    },
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectTeamKey(variables.projectId),
      });
    },
  });
}

interface RemoveArgs {
  assignmentId: string;
  projectId: string;
  personId: string;
  projectRoleId: string;
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: RemoveArgs) => {
      const { error } = await permissionsDb
        .from("team_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectTeamKey(variables.projectId),
      });
      // Deliberately does NOT invalidate anything distribution-related.
      // Removing someone from a team has no effect on their percentage,
      // and pretending otherwise by refetching would suggest it might.
    },
  });
}
