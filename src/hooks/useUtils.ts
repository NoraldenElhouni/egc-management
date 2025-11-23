import { useEffect, useState } from "react";
import { Specializations, Roles, Employees } from "../types/global.type";
import { supabase } from "../lib/supabaseClient";

export function useUtils() {
  const [specializations, setSpecializations] = useState<Specializations[]>([]);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [managers, setManagers] = useState<Employees[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    async function fetchSpecializations() {
      setLoading(true);
      const { data, error } = await supabase
        .from("specializations")
        .select("*");
      if (error) {
        console.error("error fetching specializations", error);
        setError(error);
      } else {
        setSpecializations(data ?? []);
      }
    }

    async function fetchRoles() {
      setLoading(true);
      const { data, error } = await supabase.from("roles").select("*");
      if (error) {
        console.error("error fetching roles", error);
        setError(error);
      } else {
        setRoles(data ?? []);
      }
      setLoading(false);
    }

    async function fetchManagers() {
      setLoading(true);
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("*")
        .eq("name", "Manager")
        .single();
      if (roleError || !roleData) {
        console.error("error fetching manager role", roleError);
        setError(roleError);
        setLoading(false);
        return;
      }

      const { data: UserRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role_id", [roleData.id]);

      if (userRolesError) {
        console.error("error fetching user roles for managers", userRolesError);
        setError(userRolesError);
        setLoading(false);
        return;
      }
      const userIds = UserRoles?.map((ur) => ur.user_id).filter(Boolean) ?? [];
      if (userIds.length === 0) {
        setManagers([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .in("id", userIds);
      if (error) {
        console.error("error fetching managers", error);
        setError(error);
      } else {
        setManagers(data ?? []);
      }
      setLoading(false);
    }

    fetchSpecializations();
    fetchRoles();
    fetchManagers();
  }, []);

  return { specializations, roles, managers, loading, error };
}
