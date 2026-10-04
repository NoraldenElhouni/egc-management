import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";

// D8 — Templates admin, list screen (build plan Part 7).
//
// A template is a board with is_template = true, kept in the single
// system Templates space (tasks.template_space_id()). Opening one goes to
// the ordinary board screen (/tasks/board/:id), which edits it in
// template mode — so every board feature works on a template.

export interface TemplateBoard {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
}

export function useTemplatesAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["templates-admin"];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TemplateBoard[]> => {
      const { data: boards, error: boardsError } = await tasksDb
        .from("boards")
        .select("id, name, description")
        .eq("is_template", true)
        .eq("is_archived", false)
        .order("name");
      if (boardsError) throw boardsError;

      const boardIds = (boards ?? []).map((b) => b.id);
      const { data: taskRows, error: tasksError } = boardIds.length
        ? await tasksDb.from("tasks").select("board_id").in("board_id", boardIds).eq("is_archived", false)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const countByBoard = new Map<string, number>();
      for (const row of taskRows ?? []) {
        countByBoard.set(row.board_id, (countByBoard.get(row.board_id) ?? 0) + 1);
      }

      return (boards ?? []).map((b) => ({ ...b, taskCount: countByBoard.get(b.id) ?? 0 }));
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["template-picker"] });
  };

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { data: spaceId, error: spaceError } = await tasksDb.rpc("template_space_id");
      if (spaceError) throw spaceError;
      if (!spaceId) throw new Error("templates space is missing");

      const { data, error } = await tasksDb
        .from("boards")
        .insert({ space_id: spaceId, name, is_template: true, created_by: user?.id ?? null })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await tasksDb.from("boards").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["task-board", id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("boards").delete().eq("id", id).eq("is_template", true);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    createTemplate: create.mutateAsync,
    creating: create.isPending,
    renameTemplate: rename.mutateAsync,
    deleteTemplate: remove.mutateAsync,
  };
}
