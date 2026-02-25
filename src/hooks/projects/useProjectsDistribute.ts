import { useEffect, useState } from "react";
import { Projects } from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

export function useProjectsDistribute() {
  const [projects, setProjects] = useState<Projects[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("status", "active");

        if (error) {
          console.error("Error fetching projects:", error);
          throw error;
        }

        if (error) {
          setError(error);
        } else {
          setProjects(data);
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
