import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";
import { DistributionProject } from "../../types/projects.type";

export function useProjectsDistribute() {
  const [projects, setProjects] = useState<DistributionProject[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*, project_percentage(*)")
          .eq("status", "active")
          .order("serial_number", { ascending: true });

        if (error) {
          console.error("Error fetching projects:", error);
          throw error;
        }

        const fillteredData = (data ?? []).filter(
          (p) =>
            p.project_percentage &&
            p.project_percentage.every(
              (pp: { percentage: number; period_percentage: number }) =>
                pp.percentage === 0 || pp.period_percentage === 0,
            ) === false,
        );

        if (error) {
          setError(error);
        } else {
          setProjects(fillteredData);
        }
      } catch (err) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return { projects, loading, error };
}
