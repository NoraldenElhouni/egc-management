import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function fetchEmployee() {
      setLoading(true);
      try {
        // Fetch basic employee data with certifications and documents
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
          console.error("Error fetching employee", employeeError);
          setError(employeeError);
          setLoading(false);
          return;
        }

        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select(
            `
            *,
            roles(*)
          `
          )
          .eq("user_id", id)
          .single();

        if (roleError) {
          console.error("Error fetching role", roleError);
        }

        // Fetch project assignments
        const { data: projectData, error: projectError } = await supabase
          .from("project_assignments")
          .select(
            `
            *,
            projects(*),
            project_roles(*)
          `
          )
          .eq("user_id", id);

        if (projectError) {
          console.error("Error fetching projects", projectError);
        }

        // Fetch payroll
        const { data: payrollData, error: payrollError } = await supabase
          .from("payroll")
          .select("*")
          .eq("employee_id", id);

        if (payrollError) {
          console.error("Error fetching payroll", payrollError);
        }

        // Fetch leaves
        const { data: leaveData, error: leaveError } = await supabase
          .from("employee_leaves")
          .select("*")
          .eq("employee_id", id);

        if (leaveError) {
          console.error("Error fetching leaves", leaveError);
        }

        // Combine all data
        const fullEmployeeData: FullEmployee = {
          ...employeeData,
          user_role: roleData,
          projects: projectData || [],
          payroll: payrollData || [],
          employee_leaves: leaveData || [],
        };

        setEmployee(fullEmployeeData);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [id]);

  return { employee, loading, error };
}
