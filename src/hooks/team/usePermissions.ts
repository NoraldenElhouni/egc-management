import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Permissions } from "../../types/global.type";

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

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchpermissions() {
      setLoading(true);
      const { data, error } = await supabase.from("permissions").select("*");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setPermissions(data);
      }

      setLoading(false);
    }

    fetchpermissions();
  }, []); // runs once on mount

  return { permissions, loading, error };
}

export function useProjectUserPermissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function grantPermission({
    user_id,
    project_id,
    permission_id,
    granted_by,
  }: {
    user_id: string;
    project_id: string;
    permission_id: string;
    granted_by?: string;
  }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("project_user_permissions")
      .upsert(
        { user_id, project_id, permission_id, allowed: true, granted_by },
        { onConflict: "user_id,project_id,permission_id" },
      );

    if (error) setError(error);
    setLoading(false);
    return { error };
  }

  async function revokePermission({
    user_id,
    project_id,
    permission_id,
  }: {
    user_id: string;
    project_id: string;
    permission_id: string;
  }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("project_user_permissions")
      .delete()
      .eq("user_id", user_id)
      .eq("project_id", project_id)
      .eq("permission_id", permission_id);

    if (error) setError(error);
    setLoading(false);
    return { error };
  }

  return { grantPermission, revokePermission, loading, error };
}
