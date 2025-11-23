import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fullEmployee, EmployeeWithRole } from "../types/extended.type";
import { PostgrestError } from "@supabase/supabase-js";

export function useEmployees() {
  const [employees, setemployees] = useState<EmployeeWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchemployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*, users(roles(*))");

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
  const [employee, setemployee] = useState<fullEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*, employee_certifications(*), employee_documents(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setemployee(data ?? null);
      }

      setLoading(false);
    }

    fetchEmployees();
  }, [id]); // runs once on mount}

  return { employee, loading, error };
}
