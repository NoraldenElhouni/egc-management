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

export interface EmployeeSummary {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
}

/** Employees having a given specialization, for the specialization detail page. */
export function useEmployeesBySpecialization(
  specializationId: string | undefined,
) {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!specializationId) return;
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email")
        .eq("specializations_id", specializationId);

      if (error) {
        console.error("error fetching employees by specialization", error);
        setError(error);
      } else {
        setEmployees(data ?? []);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, [specializationId]);

  return { employees, loading, error };
}

/** Employee count per specialization, for the specializations settings page. */
export function useEmployeeCountsBySpecialization() {
  const [countsBySpecialization, setCountsBySpecialization] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("specializations_id");

      if (error) {
        console.error("error fetching employee specialization counts", error);
        setError(error);
      } else {
        const counts = (data ?? []).reduce<Record<string, number>>(
          (acc, row) => {
            if (row.specializations_id)
              acc[row.specializations_id] =
                (acc[row.specializations_id] ?? 0) + 1;
            return acc;
          },
          {},
        );
        setCountsBySpecialization(counts);
      }
      setLoading(false);
    }
    fetchCounts();
  }, []);

  return { countsBySpecialization, loading, error };
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
          employee_documents(*),
          payroll(*)
        `,
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

      const normalizedProjectData = (projectData ?? []).map((project) => ({
        ...project,
        project_roles: project.project_roles ?? { id: "", name: "" },
      }));

      // 4) payroll
      const { data: payrollData } = await supabase
        .from("payroll")
        .select("*")
        .eq("employee_id", id);

      // 5) leaves

      const fullEmployeeData: FullEmployee = {
        ...employeeData,
        user_role: roleData ?? null,
        projects: normalizedProjectData,
        payroll: payrollData ?? [],
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
