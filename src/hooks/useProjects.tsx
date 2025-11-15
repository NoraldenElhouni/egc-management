import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Projects } from "../types/global.type";

export function useProjects() {
  const [projects, setProjects] = useState<Projects[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setProjects(data ?? []);
      }

      setLoading(false);
    }

    fetchProjects();
  }, []); // runs once on mount

  return { projects, loading, error };
}
