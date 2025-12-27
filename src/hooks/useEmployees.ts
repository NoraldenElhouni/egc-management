import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Employees } from "../types/global.type";
import { FullEmployee } from "../types/extended.type";
import { PostgrestError } from "@supabase/supabase-js";

export function useEmployees() {
  const [employees, setemployees] = useState<Employees[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchemployees() {
      setLoading(true);
      const { data, error } = await supabase.from("employees").select("*");

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setemployees(data ?? []);
      }

      setLoading(false);
    }

    fetchemployees();
  }, []); // runs once on mount

  return { employees, loading, error };
}

export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<FullEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // 1) employee base + certifications + documents
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select(
          `
          *,
          employee_certifications(*),
          employee_documents(*)
        `
        )
        .eq("id", id)
        .single();

      if (employeeError || !employeeData) {
        setError(employeeError ?? ({} as PostgrestError));
        setEmployee(null);
        return;
      }

      // 2) role (NOTE: if user_roles.user_id is actually auth user id, this might not be employee id)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select(`*, roles(*)`)
        .eq("user_id", id)
        .maybeSingle();

      // 3) project assignments
      const { data: projectData } = await supabase
        .from("project_assignments")
        .select(`*, projects(*), project_roles(*)`)
        .eq("user_id", id);

      // 4) payroll
      const { data: payrollData } = await supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", id);

      // 5) leaves
      const { data: leaveData } = await supabase
        .from("employee_leaves")
        .select("*")
        .eq("employee_id", id);

      const fullEmployeeData: FullEmployee = {
        ...employeeData,
        user_role: roleData ?? null,
        projects: projectData ?? [],
        payroll: payrollData ?? [],
        employee_leaves: leaveData ?? [],
      };

      setEmployee(fullEmployeeData);
    } catch (err) {
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { employee, loading, error, refetch, setEmployee };
}
