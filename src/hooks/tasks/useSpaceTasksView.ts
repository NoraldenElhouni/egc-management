import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { EmployeeLite, Priority, StatusRow, TaskTypeLite } from "./useTaskBoard";

// =====================================================================
// "Space tasks" — every task across every board (and folder) of ONE
// space, one filterable/nested-grouped list instead of picking a board
// first (build plan Part 7 follow-up, pairs with useAllTasksView.ts).
//
// No extra visibility filtering inside: reaching this page at all
// already means the space showed up in the sidebar/landing page, which
// already applied the P8 rule (private space -> owner/member only, see
// useTasksSidebar.ts). Same posture as D6/D9 — nothing in this module is
// route-guarded per-screen yet (Part 6 is on hold), only the outer
// view_tasks_section gate exists (TasksRoutes.tsx).
//
// No editing here: FlatTaskList's tree (its own consumer) always bottoms
// out at a Board node, which renders the real board table via
// BoardTaskCard.tsx — that owns its own useTaskBoard(boardId) fetch and
// mutations. This hook only needs enough to build the tree's upper
// levels (folder/board/project) and label things.

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

export interface TreeFolder {
  id: string;
  name: string;
}
export interface TreeBoard {
  id: string;
  name: string;
  folder_id: string | null;
}

export interface SpaceTasksViewData {
  space: { id: string; name: string };
  folders: TreeFolder[];
  boards: TreeBoard[];
  tasks: FlatTaskRow[];
  projectNameById: Map<string, string>;
  statusesById: Map<string, StatusRow>;
  employees: EmployeeLite[];
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
}

export function useSpaceTasksView(spaceId: string | undefined) {
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["space-tasks-view", spaceId],
    enabled: !!spaceId,
    queryFn: async (): Promise<SpaceTasksViewData> => {
      if (!spaceId) throw new Error("no space id");

      const [{ data: space, error: spaceError }, { data: boards, error: boardsError }, { data: folders, error: foldersError }] =
        await Promise.all([
          tasksDb.from("spaces").select("id, name").eq("id", spaceId).single(),
          tasksDb.from("boards").select("id, name, folder_id").eq("space_id", spaceId).eq("is_archived", false),
          tasksDb.from("folders").select("id, name").eq("space_id", spaceId).eq("is_archived", false),
        ]);
      if (spaceError) throw spaceError;
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

      return {
        space,
        boards: boards ?? [],
        folders: folders ?? [],
        tasks: tasks ?? [],
        projectNameById: new Map((projectRows ?? []).map((p) => [p.id, p.name])),
        statusesById: new Map((statusRows ?? []).map((s) => [s.id, s])),
        employees: employees ?? [],
        employeesById: new Map((employees ?? []).map((e) => [e.id, e])),
        assigneesByTask,
        taskTypes: new Map((taskTypeRows ?? []).map((t) => [t.id, t])),
      };
    },
  });

  return { data: query.data, loading: query.isPending, error: query.error };
}
