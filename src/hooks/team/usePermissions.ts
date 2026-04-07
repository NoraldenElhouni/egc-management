import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Permission {
  allowed: boolean;
  granted_at: string;
  granted_by: string | null;
  permission_id: string;
  project_id: string;
  user_id: string;
  users: {
    first_name: string;
    last_name: string | null;
  };
  projects: {
    name: string;
  };
  permissions: {
    id: string;
    name: string;
  };
}

export function getUserProjectPermissions(projectId: string, empId: string) {
  const [permission, setPermission] = useState<Permission[] | null>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch permission for the given user in project
      const { data: permission, error: permissionError } = await supabase
        .from("project_user_permissions")
        .select(
          "*, users!user_id(first_name, last_name), projects(name), permissions(*)",
        )
        .eq("project_id", projectId)
        .eq("user_id", empId);

      if (permissionError) {
        console.error("Error fetching permission:", permissionError);
        setError(permissionError);
        return;
      }

      // Map permission to a combined TeamPermission object

      setPermission(permission);
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
    permission,
    loading,
    error,
    refetch: fetchTeam,
  };
}
