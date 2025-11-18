import { useEffect, useState } from "react";
import { ProjectWithDetailsForBook } from "../../types/projects.type";
import { supabase } from "../../lib/supabaseClient";

export function useBookProject(projectId: string) {
  const [project, setProject] = useState<ProjectWithDetailsForBook | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_incomes(*), project_expenses(*)")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setProject(data);
      }

      setLoading(false);
    }

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}
