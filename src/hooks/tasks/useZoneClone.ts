import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import type { TargetBoard } from "./useTemplatePicker";
import type { EmployeeLite, TaskTypeLite } from "./useTaskBoard";

// =====================================================================
// D5 — Clone zone, build plan Part 7.
// =====================================================================
// Same copy_task_tree() RPC as D4 (see useTemplatePicker.ts's header for
// the mechanism), but p_source_type = 'task' instead of 'template'. The
// task-side branch of that function has no is_selected_by_default gate —
// it always copies a source root's *entire* subtree, unconditionally
// (see the RPC body: the recursive CTE for 'task' has no `where
// tt.is_selected_by_default` clause the template branch has). So unlike
// D4, there is nothing to toggle below the root — "pre-checked preview"
// per the build plan means every root task defaults to included, and a
// user can only opt whole root branches in or out, not individual
// descendants.
//
// It also carries assignees and checklists (reset unchecked) across
// as-is — that's server-side behavior this screen doesn't need to
// reimplement, only reflect in the preview.

export type CloneSourceTask = Pick<
  Database["tasks"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "parent_task_id" | "task_type_id" | "department_id" | "start_date" | "due_date"
>;

export function useZoneCloneBoards(spaceId: string | undefined) {
  const query = useQuery({
    queryKey: ["zone-clone-boards", spaceId],
    enabled: !!spaceId,
    queryFn: async (): Promise<TargetBoard[]> => {
      if (!spaceId) throw new Error("no space id");
      const tasksDb = supabase.schema("tasks");

      const { data: boardRows, error: boardsError } = await tasksDb
        .from("boards")
        .select("id, name, zone_id")
        .eq("space_id", spaceId)
        .eq("is_archived", false);
      if (boardsError) throw boardsError;

      const zoneIds = Array.from(
        new Set((boardRows ?? []).map((b) => b.zone_id).filter(Boolean)),
      ) as string[];
      const { data: zoneRows, error: zoneError } = zoneIds.length
        ? await supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
        : { data: [], error: null };
      if (zoneError) throw zoneError;
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      return (boardRows ?? []).map((b) => ({
        id: b.id,
        label: b.zone_id ? (zoneNameById.get(b.zone_id) ?? b.name) : b.name,
      }));
    },
  });

  return { boards: query.data ?? [], loading: query.isPending, error: query.error };
}

export interface SourceZoneData {
  tasks: CloneSourceTask[];
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
}

export function useSourceZoneTasks(sourceBoardId: string | undefined) {
  const query = useQuery({
    queryKey: ["zone-clone-source", sourceBoardId],
    enabled: !!sourceBoardId,
    queryFn: async (): Promise<SourceZoneData> => {
      if (!sourceBoardId) throw new Error("no source board id");
      const tasksDb = supabase.schema("tasks");

      const { data: tasks, error: tasksError } = await tasksDb
        .from("tasks")
        .select("id, title, parent_task_id, task_type_id, department_id, start_date, due_date")
        .eq("board_id", sourceBoardId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true });
      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const departmentIds = Array.from(
        new Set((tasks ?? []).map((t) => t.department_id).filter(Boolean)),
      ) as string[];
      const taskTypeIds = Array.from(new Set((tasks ?? []).map((t) => t.task_type_id)));

      const [
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: taskTypeRows, error: taskTypesError },
        { data: departmentRows, error: departmentsError },
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name"),
        taskTypeIds.length
          ? tasksDb.from("task_types").select("id, name_ar, color").in("id", taskTypeIds)
          : Promise.resolve({ data: [], error: null }),
        departmentIds.length
          ? supabase.from("departments").select("id, name_ar, name").in("id", departmentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (taskTypesError) throw taskTypesError;
      if (departmentsError) throw departmentsError;

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      return {
        tasks: tasks ?? [],
        employeesById: new Map((employees ?? []).map((e) => [e.id, e])),
        assigneesByTask,
        taskTypes: new Map((taskTypeRows ?? []).map((t) => [t.id, t])),
        departmentNamesById: new Map((departmentRows ?? []).map((d) => [d.id, d.name_ar ?? d.name])),
      };
    },
  });

  return { data: query.data, loading: query.isPending, error: query.error };
}

export function useCloneZoneApply() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const apply = useMutation({
    mutationFn: async ({
      selectedRootIds,
      targetBoardIds,
      anchorDate,
    }: {
      selectedRootIds: string[];
      targetBoardIds: string[];
      anchorDate: string;
    }) => {
      if (!user?.id) throw new Error("no authenticated user");

      for (const boardId of targetBoardIds) {
        for (const rootId of selectedRootIds) {
          const { error } = await tasksDb.rpc("copy_task_tree", {
            p_source_type: "task",
            p_source_root_id: rootId,
            p_target_board_id: boardId,
            p_anchor_date: anchorDate,
            p_created_by: user.id,
          });
          if (error) throw error;
        }
      }

      return { targetBoardIds };
    },
    onSuccess: ({ targetBoardIds }) => {
      for (const boardId of targetBoardIds) {
        queryClient.invalidateQueries({ queryKey: ["task-board", boardId] });
      }
    },
  });

  return { apply: apply.mutateAsync, applying: apply.isPending };
}
