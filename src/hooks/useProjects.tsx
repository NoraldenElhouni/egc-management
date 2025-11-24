import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../lib/supabase";
import { Projects } from "../types/global.type";
import { ProjectFormValues } from "../types/schema/projects.schema";

export function useProjects() {
  const [projects, setProjects] = useState<Projects[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase.from("projects").select("*");

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
    console.log("Adding project:", newProject);
    const CODE = Math.random().toString(36).substring(2, 8).toUpperCase();
    const payload: Database["public"]["Tables"]["projects"]["Insert"] = {
      name: newProject.name,
      description: (newProject.description ?? null) as string | null,
      client_id: newProject.client_id,
      address: (newProject.address ?? null) as string | null,
      status:
        newProject.status as Database["public"]["Enums"]["project_status_enum"],
      percentage: (newProject.percentage ?? null) as number | null,
      serial_number: (newProject.serial_number ?? null) as number | null,
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

    if (newProject.accounts && newProject.accounts.length > 0) {
      const accountsToInsert: Database["public"]["Tables"]["accounts"]["Insert"][] =
        newProject.accounts.map((account) => ({
          currency: account || "LYD",
          owner_id: data.id,
          owner_type: "project",
          type: "cash",
          balance: 0,
          held: 0,
        }));

      // Add the bank account
      accountsToInsert.push({
        currency: "LYD",
        owner_id: data.id,
        owner_type: "project",
        type: "bank",
        balance: 0,
        held: 0,
      });

      const { error: accountsError } = await supabase
        .from("accounts")
        .insert(accountsToInsert);

      if (accountsError) {
        console.error("error adding project accounts", accountsError);
        setError(accountsError);
      }
    }

    // update local state
    if (data) {
      setProjects((prev) => [...prev, data]);
    }

    setLoading(false);
    return data; // return the new project
  };

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*");

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
