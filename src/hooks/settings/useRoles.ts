import { useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { RoleFormValues } from "../../types/schema/Role.schema";
import { Roles, Users } from "../../types/global.type";

export function useRoles() {
  const [roles, setRoles] = useState<Roles[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("roles").select("*");
        if (error) {
          console.error("error fetching roles", error);
          setError(error);
        } else {
          setRoles(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching roles", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchRoles();
  }, []);

  const addRoles = async (form: RoleFormValues) => {
    const { error } = await supabase
      .from("roles")
      .insert({ name: form.name, code: form.code });
    if (error) {
      console.error("error adding role", error);
      return { success: false, error: "خطأ في اضافة الدور" };
    }
    return { success: true };
  };
  return { roles, loading, error, addRoles };
}

export function useRole(id: string) {
  // A role's permissions are in role_permission_grants, edited at
  // /settings/permissions/roles/:id (the old role_permissions table is gone).
  const [role, setRole] = useState<Roles | null>(null);
  const [users, setUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchRole() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("roles")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          console.error("error fetching role", error);
          setError(error);
        } else {
          setRole(data);
        }

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .eq("role_id", id);
        if (usersError) {
          console.error("error fetching users for role", usersError);
        }
        setUsers(usersData ?? []);
      } catch (err) {
        console.error("unexpected error fetching role", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchRole();
  }, [id]);

  const updateRole = async (form: RoleFormValues) => {
    const { error } = await supabase
      .from("roles")
      .update({ name: form.name, code: form.code })
      .eq("id", id);
    if (error) {
      console.error("error updating role", error);
      return { success: false, error: "خطأ في تحديث الدور" };
    }
    setRole((prev) =>
      prev ? { ...prev, name: form.name, code: form.code } : prev,
    );
    return { success: true };
  };

  return { role, users, loading, error, updateRole };
}
