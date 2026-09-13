import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";

// =====================================================================
// Creating spaces/folders/boards — this was never assigned its own D#
// in the build plan, but the plan's own Part 3 checkpoint ("a PM can
// create a project space, a zone board, and a nested task tree by hand")
// requires it, and D1's sidebar (already built) only ever *lists*
// spaces/folders/boards, never creates them. Every space/board used to
// verify D1–D11 so far was inserted by hand via SQL — this is what lets
// the app do that instead.
// =====================================================================

type SpaceType = Database["tasks"]["Enums"]["space_type"];
type Visibility = Database["tasks"]["Enums"]["visibility"];

export function useCreateTaskEntities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const invalidateSidebar = () => queryClient.invalidateQueries({ queryKey: ["tasks-sidebar"] });

  const createSpace = useMutation({
    mutationFn: async (input: {
      name: string;
      spaceType: SpaceType;
      projectId?: string | null;
      departmentId?: string | null;
      visibility: Visibility;
    }) => {
      // The DB's own CHECK constraints (spaces_type_fk_check,
      // spaces_personal_private_check) are the real guard — this just
      // avoids sending an obviously-wrong shape and getting a raw
      // constraint-violation message back instead of a clean one.
      const { data, error } = await tasksDb
        .from("spaces")
        .insert({
          name: input.name,
          space_type: input.spaceType,
          visibility: input.spaceType === "personal" ? "private" : input.visibility,
          project_id: input.spaceType === "project" ? (input.projectId ?? null) : null,
          department_id: input.spaceType === "department" ? (input.departmentId ?? null) : null,
          owner_user_id: input.spaceType === "personal" ? (user?.id ?? null) : null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: invalidateSidebar,
  });

  const createFolder = useMutation({
    mutationFn: async ({ spaceId, name }: { spaceId: string; name: string }) => {
      const { error } = await tasksDb.from("folders").insert({ space_id: spaceId, name, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: invalidateSidebar,
  });

  const createBoard = useMutation({
    mutationFn: async ({
      spaceId,
      folderId,
      name,
      zoneId,
    }: {
      spaceId: string;
      folderId: string | null;
      name: string;
      zoneId: string | null;
    }) => {
      const { error } = await tasksDb.from("boards").insert({
        space_id: spaceId,
        folder_id: folderId,
        name,
        zone_id: zoneId,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidateSidebar,
  });

  return {
    createSpace: createSpace.mutateAsync,
    creatingSpace: createSpace.isPending,
    createFolder: createFolder.mutateAsync,
    createBoard: createBoard.mutateAsync,
    creatingBoard: createBoard.isPending,
  };
}

export function useProjectOptions() {
  const query = useQuery({
    queryKey: ["project-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, serial_number")
        .order("serial_number", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return query.data ?? [];
}

export function useDepartmentOptions() {
  const query = useQuery({
    queryKey: ["department-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name, name_ar").eq("is_active", true).order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });
  return query.data ?? [];
}

export function useProjectZoneOptions(projectId: string | null | undefined) {
  const query = useQuery({
    queryKey: ["project-zone-options", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.schema("boq").from("zones").select("id, name").eq("project_id", projectId as string).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  return query.data ?? [];
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: async ({ projectId, name }: { projectId: string; name: string }) => {
      const { data, error } = await supabase.schema("boq").from("zones").insert({ project_id: projectId, name }).select("id, name").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-zone-options", variables.projectId] });
    },
  });
  return { createZone: create.mutateAsync, creatingZone: create.isPending };
}
