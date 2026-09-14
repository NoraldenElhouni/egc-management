import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
import type { EmployeeLite, Priority, StatusRow, TaskTypeLite } from "./useTaskBoard";
import type { Database } from "../../lib/supabase";

// =====================================================================
// "All tasks" — a single company-wide, cross-board, cross-space list
// (build plan Part 7 follow-up). Same P8 visibility rule as the D1
// sidebar/D6 (useTasksSidebar.ts, useDepartmentView.ts): a private
// space's tasks only show here if the current user owns that space or
// is a member of it — a colleague's private/personal space never leaks
// into this view. Public-space tasks show to anyone who reached /tasks,
// same as every other still-ungated screen in this module.
//
// Deliberately a full client-side fetch-and-filter, matching every other
// screen in this module (D2, D6, D7 all fetch everything relevant once
// and filter/sort in memory) rather than a paginated/server-filtered
// query — fine at this app's data volume, revisit if it ever isn't.

export interface FlatTaskRow {
  id: string;
  title: string;
  board_id: string;
  project_id: string | null;
  due_date: string | null;
  is_overdue: boolean;
  priority: Priority | null;
  status_id: string;
  task_type_id: string;
  parent_task_id: string | null;
  created_at: string;
}

export interface TreeSpace {
  id: string;
  name: string;
  space_type: Database["tasks"]["Enums"]["space_type"];
}
export interface TreeFolder {
  id: string;
  name: string;
  space_id: string;
}
export interface TreeBoard {
  id: string;
  name: string;
  space_id: string;
  folder_id: string | null;
}

export interface AllTasksViewData {
  tasks: FlatTaskRow[];
  spaces: TreeSpace[];
  folders: TreeFolder[];
  boards: TreeBoard[];
  projectNameById: Map<string, string>;
  statusesById: Map<string, StatusRow>;
  employees: EmployeeLite[];
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  subtaskProgressByTask: Map<string, { done: number; total: number }>;
}

export function useAllTasksView() {
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["all-tasks-view", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AllTasksViewData> => {
      if (!user?.id) throw new Error("no authenticated user");
      const userId = user.id;

      const [
        { data: spaceRows, error: spacesError },
        { data: memberRows, error: membersError },
      ] = await Promise.all([
        tasksDb.from("spaces").select("id, name, space_type, visibility, owner_user_id").eq("is_archived", false),
        tasksDb.from("space_members").select("space_id").eq("user_id", userId),
      ]);
      if (spacesError) throw spacesError;
      if (membersError) throw membersError;

      const memberSpaceIds = new Set((memberRows ?? []).map((r) => r.space_id));
      const visibleSpaces = (spaceRows ?? []).filter(
        (s) => s.visibility === "public" || s.owner_user_id === userId || memberSpaceIds.has(s.id),
      );
      const visibleSpaceIds = visibleSpaces.map((s) => s.id);

      const [{ data: boards, error: boardsError }, { data: folders, error: foldersError }] = visibleSpaceIds.length
        ? await Promise.all([
            tasksDb.from("boards").select("id, name, space_id, folder_id").in("space_id", visibleSpaceIds).eq("is_archived", false),
            tasksDb.from("folders").select("id, name, space_id").in("space_id", visibleSpaceIds).eq("is_archived", false),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];
      if (boardsError) throw boardsError;
      if (foldersError) throw foldersError;

      const boardIds = (boards ?? []).map((b) => b.id);

      const { data: tasks, error: tasksError } = boardIds.length
        ? await tasksDb
            .from("tasks")
            .select("id, title, board_id, project_id, due_date, is_overdue, priority, status_id, task_type_id, parent_task_id, created_at")
            .in("board_id", boardIds)
            .eq("is_archived", false)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const statusIds = Array.from(new Set((tasks ?? []).map((t) => t.status_id)));
      const taskTypeIds = Array.from(new Set((tasks ?? []).map((t) => t.task_type_id)));
      const projectIds = Array.from(new Set((tasks ?? []).map((t) => t.project_id).filter(Boolean))) as string[];

      const [
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: statusRows, error: statusesError },
        { data: taskTypeRows, error: taskTypesError },
        { data: projectRows, error: projectsError },
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name"),
        statusIds.length
          ? tasksDb.from("statuses").select("*").in("id", statusIds)
          : Promise.resolve({ data: [], error: null }),
        taskTypeIds.length
          ? tasksDb.from("task_types").select("id, name_ar, color").in("id", taskTypeIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length
          ? supabase.from("projects").select("id, name").in("id", projectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (statusesError) throw statusesError;
      if (taskTypesError) throw taskTypesError;
      if (projectsError) throw projectsError;

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      const statusesById = new Map((statusRows ?? []).map((s) => [s.id, s]));
      const categoryByStatusId = new Map((statusRows ?? []).map((s) => [s.id, s.category]));
      const subtaskProgressByTask = new Map<string, { done: number; total: number }>();
      for (const t of tasks ?? []) {
        if (!t.parent_task_id) continue;
        const progress = subtaskProgressByTask.get(t.parent_task_id) ?? { done: 0, total: 0 };
        progress.total += 1;
        const category = categoryByStatusId.get(t.status_id);
        if (category === "done" || category === "closed") progress.done += 1;
        subtaskProgressByTask.set(t.parent_task_id, progress);
      }

      return {
        tasks: tasks ?? [],
        spaces: visibleSpaces.map((s) => ({ id: s.id, name: s.name, space_type: s.space_type })),
        folders: folders ?? [],
        boards: boards ?? [],
        projectNameById: new Map((projectRows ?? []).map((p) => [p.id, p.name])),
        statusesById,
        employees: employees ?? [],
        employeesById: new Map((employees ?? []).map((e) => [e.id, e])),
        assigneesByTask,
        taskTypes: new Map((taskTypeRows ?? []).map((t) => [t.id, t])),
        subtaskProgressByTask,
      };
    },
  });

  return { data: query.data, loading: query.isPending, error: query.error };
}
