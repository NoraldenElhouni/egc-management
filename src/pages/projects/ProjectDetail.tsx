import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

type Project = {
  id: string;
  title: string;
  description: string;
  // other fields...
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>(); // id may be undefined typewise
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate id if you expect numeric ids:
  // if (id && !/^\d+$/.test(id)) { /* handle invalid id */ }

  useEffect(() => {
    if (!id) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setProject(data as Project);
        } else {
          console.error("Project not found for id:", id, error);
          setError(error ? error.message : "Project not found.");
        }
      } catch (err: unknown) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) return <div>Loading project…</div>;
  if (error)
    return (
      <div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold">{project.title}</h1>
      <p className="mt-2">{project.description}</p>

      <div className="mt-4"></div>
    </div>
  );
}
