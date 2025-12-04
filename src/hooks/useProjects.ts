import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../lib/supabase";
import { Projects } from "../types/global.type";
import { ProjectFormValues } from "../types/schema/projects.schema";
import { FullProject, ProjectWithAssignments } from "../types/extended.type";
import { PostgrestError } from "@supabase/supabase-js";

export function useProjects() {
  const [projects, setProjects] = useState<FullProject[] | null>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_balances(*), project_percentage(*)")
        .order("serial_number", { ascending: true });

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setProjects(data ?? []);
      }

      setLoading(false);
    }

    fetchProjects();
  }, []); // runs once on mount

  const addProject = async (newProject: ProjectFormValues) => {
    setLoading(true);
    // fetch the company projects_counter for serial number
    const { data: companyData, error: companyError } = await supabase
      .from("company")
      .select("*")
      .single();

    if (companyError) {
      console.error("error fetching company data", companyError);
      setError(companyError);
      setLoading(false);
      return null;
    }

    const CODE = Math.random().toString(36).substring(2, 8).toUpperCase();
    const payload: Database["public"]["Tables"]["projects"]["Insert"] = {
      name: newProject.name,
      description: (newProject.description ?? null) as string | null,
      client_id: newProject.client_id,
      address: (newProject.address ?? null) as string | null,
      status: "active",
      serial_number: companyData?.projects_counter ?? null,
      code: CODE,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single(); // return inserted row

    if (error) {
      console.error("error adding project", error);
      setError(error);
      setLoading(false);
      return null;
    }

    // insert project_balances
    const balancesToInsert: Database["public"]["Tables"]["project_balances"]["Insert"][] =
      ["USD", "EUR", "LYD"].map((currency) => ({
        project_id: data.id,
        balance: 0,
        held: 0,
        currency,
      }));

    const { error: projectBalancesError } = await supabase
      .from("project_balances")
      .insert(balancesToInsert);

    if (projectBalancesError) {
      console.error("error adding project balances", projectBalancesError);
      setError(projectBalancesError);
    }

    // ensure cash accounts for USD, EUR, LYD and add a LYD bank account
    const accountsToInsertAll: Database["public"]["Tables"]["accounts"]["Insert"][] =
      (["USD", "EUR", "LYD"] as const).map((currency) => ({
        currency,
        owner_id: data.id,
        owner_type: "project",
        type: "cash",
        balance: 0,
        held: 0,
      }));

    // add bank account for LYD (so LYD has both cash and bank)
    accountsToInsertAll.push({
      currency: "LYD",
      owner_id: data.id,
      owner_type: "project",
      type: "bank",
      balance: 0,
      held: 0,
    });

    const { error: accountsError } = await supabase
      .from("accounts")
      .insert(accountsToInsertAll);

    if (accountsError) {
      console.error("error adding project accounts", accountsError);
      setError(accountsError);
    }

    // insert percentage
    const percentageData: Database["public"]["Tables"]["project_percentage"]["Insert"][] =
      (["USD", "EUR", "LYD"] as const).map((currency) => ({
        period_start: new Date().toISOString(),
        project_id: data.id,
        percentage: newProject.percentage ?? 0,
        currency: currency,
        period_percentage: 0,
        total_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    const { error: percentageError } = await supabase
      .from("project_percentage")
      .insert(percentageData);

    if (percentageError) {
      console.error("error adding project percentage", percentageError);
      setError(percentageError);
    }

    // update counter in company table
    const { error: counterError } = await supabase
      .from("company")
      .update({
        projects_counter: (companyData?.projects_counter || 0) + 1,
      })
      .eq("id", companyData?.id);

    if (counterError) {
      console.error("error updating company projects counter", counterError);
      setError(counterError);
    }

    // update local state
    if (data) {
      const newProjectWithRelations = {
        ...data,
        project_balances: [],
        project_percentage: [],
      } as unknown as FullProject;
      setProjects((prev) => [...(prev ?? []), newProjectWithRelations]);
    }

    setLoading(false);
    return data; // return the new project
  };

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*, project_balances(*), project_percentage(*)");

    if (error) {
      console.error("error refreshing projects", error);
      setError(error);
      setLoading(false);
      return null;
    }

    setProjects(data ?? []);
    setError(null);
    setLoading(false);
    return data;
  };

  return { projects, loading, error, addProject, refresh };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Projects | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("error fetching employyes", error);
        setError(error);
      } else {
        setProject(data);
      }

      setLoading(false);
    }

    fetchProject();
  }, [id]);

  return { project, loading, error };
}

export function useProjectsWithAssignments() {
  const [projects, setProjects] = useState<ProjectWithAssignments[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(
          `id, code, name, project_assignments(user_id, employees(first_name,last_name))`
        );

      if (error) {
        console.error("error fetching project", error);
        setError(error);
        setProjects([]);
      }
      const { data: percentage, error: percentageError } = await supabase
        .from("project_percentage")
        .select(
          `project_id, total_percentage, percentage, period_percentage, period_start`
        )
        .in("project_id", data?.map((p) => p.id) || [])
        .eq("currency", "LYD");

      if (percentageError) {
        console.error("error fetching project percentage", percentageError);
        setError(percentageError);
      }
      const projectsWithPercentages = (data || []).map((project) => {
        const projectPercentage =
          percentage?.find((p) => p.project_id === project.id) || null;
        return {
          ...project,
          project_percentage: projectPercentage,
        };
      });

      setProjects(
        projectsWithPercentages as unknown as ProjectWithAssignments[]
      );
      setLoading(false);
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}
export function useProjectWithAssignments(projectId: string) {
  const [project, setProject] = useState<ProjectWithAssignments | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(
          `id, code, name, project_assignments(user_id, employees(first_name,last_name))`
        )
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("error fetching project", error);
        setError(error);
        setProject(null);
      }
      const { data: percentage, error: percentageError } = await supabase
        .from("project_percentage")
        .select(
          `project_id, total_percentage, percentage, period_percentage, period_start`
        )
        .eq("project_id", data?.id || "")
        .eq("currency", "LYD")
        .single();

      if (percentageError) {
        console.error("error fetching project percentage", percentageError);
        setError(percentageError);
      }
      const projectsWithPercentages = {
        ...data,
        project_percentage: percentage,
      };

      setProject(projectsWithPercentages as unknown as ProjectWithAssignments);
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}
