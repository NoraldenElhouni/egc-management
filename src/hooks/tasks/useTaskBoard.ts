import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import { resolveStatusSetId } from "./resolveStatusSetId";

// D2 — Zone board (list view), the main screen (build plan Part 7, D2).

export type TaskRow = Database["tasks"]["Tables"]["tasks"]["Row"];
export type StatusRow = Database["tasks"]["Tables"]["statuses"]["Row"];
export type Priority = Database["tasks"]["Enums"]["priority"];

export interface EmployeeLite {
  id: string;
  first_name: string;
  last_name: string | null;
}

export interface TaskTypeLite {
  id: string;
  name_ar: string;
  color: string | null;
}

export interface TaskBoardData {
  board: { id: string; name: string; space_id: string; zone_id: string | null };
  zoneName: string | null;
  statuses: StatusRow[];
  tasks: TaskRow[];
  assigneesByTask: Map<string, string[]>; // task_id -> user_id[]
  employees: EmployeeLite[];
  taskTypes: Map<string, TaskTypeLite>;
  departmentNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  /** null when the board's space has no project — task creation is disabled (see build plan Part 11 open decision on project_id). */
  projectId: string | null;
}

export function useTaskBoard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["task-board", boardId];

  const query = useQuery({
    queryKey,
    enabled: !!boardId,
    queryFn: async (): Promise<TaskBoardData> => {
      if (!boardId) throw new Error("no board id");

      const { data: board, error: boardError } = await tasksDb
        .from("boards")
        .select("id, name, space_id, zone_id, status_set_id")
        .eq("id", boardId)
        .single();
      if (boardError) throw boardError;

      const [{ data: space, error: spaceError }, statusSetId, zoneRow] =
        await Promise.all([
          tasksDb
            .from("spaces")
            .select("project_id")
            .eq("id", board.space_id)
            .single(),
          resolveStatusSetId(board.status_set_id, board.space_id),
          board.zone_id
            ? supabase.schema("boq").from("zones").select("name").eq("id", board.zone_id).single()
            : Promise.resolve({ data: null, error: null }),
        ]);
      if (spaceError) throw spaceError;
      if (zoneRow.error) throw zoneRow.error;

      const [
        { data: statuses, error: statusesError },
        { data: tasks, error: tasksError },
      ] = await Promise.all([
        tasksDb
          .from("statuses")
          .select("*")
          .eq("status_set_id", statusSetId)
          .order("sort_order", { ascending: true }),
        tasksDb
          .from("tasks")
          .select("*")
          .eq("board_id", boardId)
          .eq("is_archived", false)
          .order("sort_order", { ascending: true }),
      ]);
      if (statusesError) throw statusesError;
      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const departmentIds = Array.from(
        new Set((tasks ?? []).map((t) => t.department_id).filter(Boolean)),
      ) as string[];
      const taskTypeIds = Array.from(
        new Set((tasks ?? []).map((t) => t.task_type_id)),
      );

      const [
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: taskTypeRows, error: taskTypesError },
        { data: departmentRows, error: departmentsError },
        linksResult,
        dependenciesResult,
        requirementsResult,
      ] = await Promise.all([
        taskIds.length
          ? tasksDb
              .from("task_assignees")
              .select("task_id, user_id")
              .in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name"),
        taskTypeIds.length
          ? tasksDb
              .from("task_types")
              .select("id, name_ar, color")
              .in("id", taskTypeIds)
          : Promise.resolve({ data: [], error: null }),
        departmentIds.length
          ? supabase.from("departments").select("id, name_ar, name").in("id", departmentIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_links").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb
              .from("task_dependencies")
              .select("blocked_task_id, blocking_task_id")
              .in("blocked_task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb
              .from("task_requirements")
              .select("task_id")
              .in("task_id", taskIds)
              .eq("is_satisfied", false)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (taskTypesError) throw taskTypesError;
      if (departmentsError) throw departmentsError;
      if (linksResult.error) throw linksResult.error;
      if (dependenciesResult.error) throw dependenciesResult.error;
      if (requirementsResult.error) throw requirementsResult.error;

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      const taskTypes = new Map<string, TaskTypeLite>(
        (taskTypeRows ?? []).map((t) => [t.id, t]),
      );

      const departmentNamesById = new Map<string, string>(
        (departmentRows ?? []).map((d) => [d.id, d.name_ar ?? d.name]),
      );

      const linkedTaskIds = new Set((linksResult.data ?? []).map((r) => r.task_id));

      // A dependency only still "blocks" if the task blocking it hasn't
      // reached a done/closed status yet.
      const blockingIds = Array.from(
        new Set((dependenciesResult.data ?? []).map((d) => d.blocking_task_id)),
      );
      let openBlockingIds = new Set<string>();
      if (blockingIds.length) {
        const { data: blockingTasks, error: blockingError } = await tasksDb
          .from("tasks")
          .select("id, status_id")
          .in("id", blockingIds);
        if (blockingError) throw blockingError;
        const blockingStatusIds = Array.from(
          new Set((blockingTasks ?? []).map((t) => t.status_id)),
        );
        const { data: blockingStatuses, error: blockingStatusesError } =
          blockingStatusIds.length
            ? await tasksDb
                .from("statuses")
                .select("id, category")
                .in("id", blockingStatusIds)
            : { data: [], error: null };
        if (blockingStatusesError) throw blockingStatusesError;
        const categoryByStatus = new Map(
          (blockingStatuses ?? []).map((s) => [s.id, s.category]),
        );
        openBlockingIds = new Set(
          (blockingTasks ?? [])
            .filter((t) => {
              const category = categoryByStatus.get(t.status_id);
              return category !== "done" && category !== "closed";
            })
            .map((t) => t.id),
        );
      }
      const blockedTaskIds = new Set(
        (dependenciesResult.data ?? [])
          .filter((d) => openBlockingIds.has(d.blocking_task_id))
          .map((d) => d.blocked_task_id),
      );

      const unmetRequirementTaskIds = new Set(
        (requirementsResult.data ?? []).map((r) => r.task_id),
      );

      return {
        board: {
          id: board.id,
          name: board.name,
          space_id: board.space_id,
          zone_id: board.zone_id,
        },
        zoneName: zoneRow.data?.name ?? null,
        statuses: statuses ?? [],
        tasks: tasks ?? [],
        assigneesByTask,
        employees: employees ?? [],
        taskTypes,
        departmentNamesById,
        linkedTaskIds,
        blockedTaskIds,
        unmetRequirementTaskIds,
        projectId: space.project_id,
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ status_id: statusId })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePriority = useMutation({
    mutationFn: async ({
      taskId,
      priority,
    }: {
      taskId: string;
      priority: Priority | null;
    }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ priority })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateDueDate = useMutation({
    mutationFn: async ({
      taskId,
      dueDate,
    }: {
      taskId: string;
      dueDate: string | null;
    }) => {
      const { error } = await tasksDb
        .from("tasks")
        .update({ due_date: dueDate })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setAssignees = useMutation({
    mutationFn: async ({
      taskId,
      userIds,
    }: {
      taskId: string;
      userIds: string[];
    }) => {
      const current = query.data?.assigneesByTask.get(taskId) ?? [];
      const toAdd = userIds.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !userIds.includes(id));

      if (toRemove.length) {
        const { error } = await tasksDb
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .in("user_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length && user?.id) {
        const { error } = await tasksDb.from("task_assignees").insert(
          toAdd.map((userId) => ({
            task_id: taskId,
            user_id: userId,
            assigned_by: user.id,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const createTask = useMutation({
    mutationFn: async ({
      title,
      parentTaskId,
    }: {
      title: string;
      parentTaskId: string | null;
    }) => {
      if (!boardId || !query.data) throw new Error("board not loaded");
      if (!query.data.projectId) {
        throw new Error(
          "هذه اللوحة غير مرتبطة بمشروع بعد، لا يمكن إضافة مهام إليها",
        );
      }
      const firstOpenStatus =
        query.data.statuses.find((s) => s.category === "not_started") ??
        query.data.statuses[0];
      if (!firstOpenStatus) throw new Error("لا توجد حالات معرّفة لهذه اللوحة");

      const maxSort = query.data.tasks
        .filter((t) => t.parent_task_id === parentTaskId)
        .reduce((max, t) => Math.max(max, t.sort_order), -1);

      const { error } = await tasksDb.from("tasks").insert({
        board_id: boardId,
        parent_task_id: parentTaskId,
        title,
        status_id: firstOpenStatus.id,
        project_id: query.data.projectId,
        created_by: user?.id ?? null,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const employeesById = useMemo(() => {
    return new Map((query.data?.employees ?? []).map((e) => [e.id, e]));
  }, [query.data?.employees]);

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    employeesById,
    updateStatus: updateStatus.mutate,
    updatePriority: updatePriority.mutate,
    updateDueDate: updateDueDate.mutate,
    setAssignees: setAssignees.mutate,
    createTask: createTask.mutate,
    createTaskError: createTask.error as Error | null,
  };
}
