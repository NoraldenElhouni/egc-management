import { useEffect, useState } from "react";
import { Roles } from "../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { RoleFormValues } from "../../types/schema/Role.schema";

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
