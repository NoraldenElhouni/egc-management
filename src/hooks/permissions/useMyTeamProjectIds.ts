import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Project ids the current user is on the team of. Small by construction
 * (one person, not "every project") — a cheap way to get real candidate
 * projects for a team_projects_only-scoped grant, as opposed to guessing
 * at company-wide project ids that may have nothing to do with them.
 */
export function useMyTeamProjectIds(userId: string | null): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setIds([]);
      return;
    }

    let alive = true;

    supabase
      .from("team_assignments")
      .select("project_id")
      .eq("person_id", userId)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error(error);
          setIds([]);
          return;
        }
        setIds((data ?? []).map((row) => row.project_id));
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  return ids;
}
