import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Permissions } from "../../types/global.type";

interface Permission {
  permission_id: string;
  allowed: boolean;
  granted_at: string;
  granted_by: string | null;
  permissions: {
    id: string;
    name: string;
  };
}
interface users {
  id: string;
  first_name: string;
  last_name: string | null;
}
interface Project {
  id: string;
  name: string;
}

export function getUserProjectPermissions(projectId: string, userId: string) {
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [user, setUser] = useState<users | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("project_user_permissions")
        .select(
          `
          permission_id,
          allowed,
          granted_at,
          granted_by,
          permissions(id, name)
        `,
        )
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("id", userId)
        .single();

      if (userError) {
        setError(userError);
        setPermissions(data);
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .single();

      if (projectError) {
        setError(projectError);
        setPermissions(data);
        setUser(user);
        return;
      }

      setPermissions(data);
      setUser(user);
      setProject(project);
    } catch (err) {
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    user,
    project,
    loading,
    error,
    refetch: fetchPermissions,
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
