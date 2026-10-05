import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";

// Project roles on template tasks (tasks.task_role_assignees) — "this task
// goes to the Project Manager", resolved to the real people only when the
// template is applied or pushed (tasks._assign_roles). Only template tasks
// carry roles; a real task's assignees are always people.

/** taskIds: the template tasks to load roles for (a whole board, or one
 * task for the detail panel). scope only namespaces the cache entry. */
export function useTaskRoles(scope: string | undefined, taskIds: string[], enabled: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  // the ids are part of the key so a newly added task gets its roles loaded
  const queryKey = ["task-roles", scope, taskIds.join(",")];

  const query = useQuery({
    queryKey,
    enabled: enabled && !!scope,
    queryFn: async (): Promise<Map<string, string[]>> => {
      const rolesByTask = new Map<string, string[]>();
      if (taskIds.length === 0) return rolesByTask;
      const { data, error } = await tasksDb
        .from("task_role_assignees")
        .select("task_id, project_role_id")
        .in("task_id", taskIds);
      if (error) throw error;
      for (const row of data ?? []) {
        const list = rolesByTask.get(row.task_id) ?? [];
        list.push(row.project_role_id);
        rolesByTask.set(row.task_id, list);
      }
      return rolesByTask;
    },
  });

  const setTaskRoles = useMutation({
    mutationFn: async ({ taskId, roleIds }: { taskId: string; roleIds: string[] }) => {
      const current = query.data?.get(taskId) ?? [];
      const toAdd = roleIds.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !roleIds.includes(id));

      if (toRemove.length) {
        const { error } = await tasksDb
          .from("task_role_assignees")
          .delete()
          .eq("task_id", taskId)
          .in("project_role_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length) {
        const { error } = await tasksDb
          .from("task_role_assignees")
          .insert(toAdd.map((project_role_id) => ({ task_id: taskId, project_role_id, created_by: user?.id ?? null })));
        if (error) throw error;
      }
    },
    // every scope that might show this task (its board and its detail panel)
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-roles"] }),
  });

  return {
    rolesByTask: query.data ?? new Map<string, string[]>(),
    setTaskRoles: setTaskRoles.mutate,
  };
}
