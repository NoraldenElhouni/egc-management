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

      const { data, error } = await supabase
        .from("projects")
        .select(
          "*, project_percentage(*), project_assignments(*, employees(*))",
        )
        .eq("status", "active")
        .order("serial_number", { ascending: true });

      if (error) {
        console.error("Error fetching projects:", error);
        setError(error);
        setLoading(false);
        return;
      }

      // Keep only projects that have at least one percentage entry
      // where both percentage and period_percentage are non-zero
      const filteredData = data
        .filter((p) =>
          p.project_percentage?.some(
            (pp) => pp.percentage !== 0 && pp.period_percentage !== 0,
          ),
        )
        .map((project) => ({
          ...project,
          project_assignments:
            project.project_assignments?.map((assignment) => ({
              ...assignment,
              employees: Array.isArray(assignment.employees)
                ? assignment.employees
                : assignment.employees
                  ? [assignment.employees]
                  : [],
            })) ?? [],
        }));

      setProjects(filteredData as DistributionProject[]);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}
