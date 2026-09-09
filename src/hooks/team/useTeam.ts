import { useEffect, useState, useCallback } from "react";
import { TeamEmployee } from "../../types/team.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
// team_assignments and project_roles are not in the generated types yet
// (Phase 1 added the first, and the generator has not been re-run), so
// they go through the hand-typed client. Same connection, same session.
import { permissionsDb } from "../../lib/permissionsDb";

type ProjectRole = {
  id: string;
  name: string;
}[];

/**
 * PHASE 4: repointed from project_assignments to team_assignments.
 *
 * `percentage` is gone from the returned shape. It never belonged on a
 * team object — team membership and payout share are separate facts in
 * separate tables (guide section 2.2 / 2.3). Anything that needs a
 * percentage must read project_distributions, which is Phase 5.
 *
 * NOTE: the project Team tab no longer uses this hook; it uses
 * useProjectTeam in useTeamAssignments.ts, which also carries the write
 * paths and the dual-write. This one is kept and corrected because it is
 * exported and could still be imported elsewhere — leaving it pointed at
 * the old table would make two parts of the app disagree about who is on
 * a team.
 */
export function useTeam(projectId: string) {
  const [employees, setEmployees] = useState<TeamEmployee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: assignments, error: assignmentsError } = await permissionsDb
        .from("team_assignments")
        .select("id, person_id, project_id, project_role_id")
        .eq("project_id", projectId);

      if (assignmentsError) {
        console.error("Error fetching team assignments:", assignmentsError);
        setError(assignmentsError);
        return;
      }

      const rows = assignments ?? [];
      if (rows.length === 0) {
        setEmployees([]);
        return;
      }

      // Joined in JS rather than with an embed — team_assignments has no
      // declared relationships in the generated types yet.
      const personIds = Array.from(new Set(rows.map((r) => r.person_id)));
      const roleIds = Array.from(new Set(rows.map((r) => r.project_role_id)));

      const [{ data: employeeRows }, { data: roleRows }] = await Promise.all([
        supabase.from("employees").select("*").in("id", personIds),
        permissionsDb.from("project_roles").select("id, name").in("id", roleIds),
      ]);

      const employeeById = new Map(
        (employeeRows ?? []).map((e) => [e.id, e]),
      );
      const roleNameById = new Map(
        (roleRows ?? []).map((r) => [r.id, r.name]),
      );

      // One entry per ASSIGNMENT. A person holding two project roles on
      // one project appears twice, which is correct and must not be
      // deduped away — the assignment_id distinguishes them.
      const team: TeamEmployee[] = rows.map((assignment) => {
        const emp = employeeById.get(assignment.person_id) ?? {};
        return {
          ...emp,
          project_id: assignment.project_id,
          role: roleNameById.get(assignment.project_role_id) ?? null,
          assignment_id: assignment.id,
        } as TeamEmployee;
      });

      setEmployees(team);
    } catch (err) {
      console.error("Unexpected error fetching team:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    employees,
    loading,
    error,
    refetch: fetchTeam,
  };
}

export function useProjectRole() {
  const [roles, setRoles] = useState<ProjectRole>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rolesError } = await supabase
          .from("project_roles")
          .select("id, name")
          .order("name", { ascending: true });

        if (rolesError) {
          console.error("Error fetching project roles:", rolesError);
          setError(rolesError);
          return;
        }

        setRoles(data || []);
      } catch (err) {
        console.error("Unexpected error fetching roles:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, []);

  return { roles, loading, error };
}
