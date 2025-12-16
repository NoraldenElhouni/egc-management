import { useEffect, useState } from "react";
import { TeamEmployee } from "../../types/team.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

export function useTeam(projectId: string) {
  const [emplyees, setEmployees] = useState<TeamEmployee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      setLoading(true);
      try {
        // Fetch assignments for the given project and include employee and role relations
        const { data: assignments, error: assignmentsError } = await supabase
          .from("project_assignments")
          .select(`id, user_id, percentage, project_roles(name), employees(*)`)
          .eq("project_id", projectId);

        if (assignmentsError) {
          console.error("error fetching assignments", assignmentsError);
          setError(assignmentsError);
          setLoading(false);
          return;
        }

        // Map assignments to a combined TeamEmployee object
        const team: TeamEmployee[] = (assignments || []).map((a: any) => {
          const emp = a.employees || {};
          return {
            ...emp,
            percentage: a.percentage ?? null,
            role: a.project_roles?.name ?? null,
            assignment_id: a.id ?? null,
          } as TeamEmployee;
        });

        setEmployees(team);
      } catch (err) {
        console.error("unexpected error fetching team", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }

    fetchTeam();
  }, [projectId]);

  return { emplyees, loading, error };
}
