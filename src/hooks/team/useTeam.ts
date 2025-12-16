import { useEffect, useState, useCallback } from "react";
import { TeamEmployee } from "../../types/team.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

type ProjectRole = {
  id: string;
  name: string;
}[];

export function useTeam(projectId: string) {
  const [employees, setEmployees] = useState<TeamEmployee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch assignments for the given project and include employee and role relations
      const { data: assignments, error: assignmentsError } = await supabase
        .from("project_assignments")
        .select(
          `
          id,
          user_id,
          percentage,
          project_roles(id, name),
          employees(*)
        `
        )
        .eq("project_id", projectId);

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        setError(assignmentsError);
        return;
      }

      // Map assignments to a combined TeamEmployee object
      const team: TeamEmployee[] = (assignments || []).map((assignment) => {
        const emp = assignment.employees || {};
        return {
          ...emp,
          percentage: assignment.percentage ?? null,
          role: assignment.project_roles?.name ?? null,
          assignment_id: assignment.id ?? null,
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
