import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

type Project = {
  id: number | string;
  name: string;
};

const Sidebar: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name");

        if (error) throw error;

        setProjects((data ?? []) as Project[]);
      } catch (err: unknown) {
        console.error("Failed to load projects:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <aside
      role="complementary"
      className="fixed inset-y-0 right-0 w-64 border-l shadow-sm z-40 hidden sm:block"
    >
      <div className="h-full overflow-auto p-4 flex flex-col space-y-2">
        <div className="mb-2 flex justify-center hover:scale-105 transition-transform duration-200">
          <Link to="/">Logo</Link>
        </div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold">المشاريع</h2>
        </div>

        {loading && <div className="text-sm text-slate-500">جاري التحميل…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        <nav className="flex-1">
          <ul className="space-y-1">
            {projects.map((p) => {
              const to = `/projects/${p.id}`;
              const active = location.pathname === to;
              return (
                <li key={p.id}>
                  <Link
                    to={to}
                    className={`block rounded-md px-2 py-1 text-sm hover:bg-slate-100 ${
                      active ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    {p.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-4">
          <Link
            to="/projects"
            className="text-xs text-slate-600 hover:underline"
          >
            View all projects
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
