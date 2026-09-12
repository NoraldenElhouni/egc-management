import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";

// D8 — Template builder admin, list screen (build plan Part 7).

export type Template = Database["tasks"]["Tables"]["templates"]["Row"];
type TemplateScope = Database["tasks"]["Enums"]["template_scope"];

export interface TemplateWithCount extends Template {
  taskCount: number;
}

export function useTemplatesAdmin() {
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["templates-admin"];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TemplateWithCount[]> => {
      const { data: templates, error: templatesError } = await tasksDb
        .from("templates")
        .select("*")
        .order("name_ar");
      if (templatesError) throw templatesError;

      const templateIds = (templates ?? []).map((t) => t.id);
      const { data: taskRows, error: tasksError } = templateIds.length
        ? await tasksDb.from("template_tasks").select("template_id").in("template_id", templateIds)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const countByTemplate = new Map<string, number>();
      for (const row of taskRows ?? []) {
        countByTemplate.set(row.template_id, (countByTemplate.get(row.template_id) ?? 0) + 1);
      }

      return (templates ?? []).map((t) => ({ ...t, taskCount: countByTemplate.get(t.id) ?? 0 }));
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; name_ar: string; template_scope: TemplateScope; applies_to: string | null }) => {
      const { data, error } = await tasksDb.from("templates").insert(input).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    createTemplate: create.mutateAsync,
    creating: create.isPending,
    deleteTemplate: remove.mutateAsync,
  };
}
