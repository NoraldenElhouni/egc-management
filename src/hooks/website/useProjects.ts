import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { NewProjectFormValues } from "../../types/schema/website/newProject.schema";

export interface Project {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  status_ar: string | null;
  status_en: string | null;
  year: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  category_id: string;
  categories: { name_ar: string; name_en: string } | null;
}

const PROJECTS_QUERY_KEY = ["website", "projects"];

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .schema("website")
    .from("projects")
    .select("*, categories(name_ar, name_en)")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
};

const createProject = async (
  values: NewProjectFormValues,
): Promise<Project> => {
  const { data: lastProject, error: fetchError } = await supabase
    .schema("website")
    .from("projects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const nextSortOrder = lastProject ? lastProject.sort_order + 1 : 0;

  const { data, error } = await supabase
    .schema("website")
    .from("projects")
    .insert({ ...values, sort_order: nextSortOrder })
    .select("*, categories(name_ar, name_en)")
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Project;
};

/** Recomputes sort_order to match each project's position in the array. */
export const withSortOrder = (projects: Project[]): Project[] =>
  projects.map((project, index) => ({ ...project, sort_order: index }));

const reorderProjects = async (projects: Project[]): Promise<void> => {
  const { error } = await supabase
    .schema("website")
    .from("projects")
    .upsert(
      projects.map((project) => ({
        id: project.id,
        category_id: project.category_id,
        slug: project.slug,
        title_ar: project.title_ar,
        title_en: project.title_en,
        sort_order: project.sort_order,
      })),
      { onConflict: "id" },
    );

  if (error) throw new Error(error.message);
};

export const useProjectsQuery = () =>
  useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
};

export const useReorderProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderProjects,
    onMutate: async (nextProjects) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });
      const previous = queryClient.getQueryData<Project[]>(
        PROJECTS_QUERY_KEY,
      );
      queryClient.setQueryData(PROJECTS_QUERY_KEY, nextProjects);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PROJECTS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
};
