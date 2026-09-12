import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import type { EmployeeLite, StatusRow } from "./useTaskBoard";

// =====================================================================
// D6 — Department view (build plan Part 7).
// =====================================================================
// "Unassigned is the number that matters" (build plan) — work that
// reached the department and nobody picked up. Both the metric card and
// the team-load strip's own "unassigned" row count the SAME thing: open
// department tasks with zero assignees. They're computed once here and
// used in both places so they can never silently disagree.
//
// Visibility follows the same P8 rule as the D1 sidebar (useTasksSidebar):
// a private space only counts if the user owns it or is a member — this
// isn't re-derived from a shared hook because the sidebar's version is
// folded into its own space-tree shape, not a reusable primitive on its
// own; duplicating the ~15-line visibility fetch here matches this
// codebase's own convention of scoping small query blocks per screen
// (see AssigneeCell's initials()/colorFor(), useZoneClone's board fetch).

type TaskLite = Pick<
  Database["tasks"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "board_id" | "project_id" | "zone_id" | "due_date" | "is_overdue" | "priority" | "status_id"
>;

export interface DepartmentMetrics {
  open: number;
  overdue: number;
  blocked: number;
  unassigned: number;
}

export interface ZoneGroup {
  zoneId: string | null;
  zoneName: string | null;
  tasks: TaskLite[];
}

export interface ProjectGroup {
  projectId: string;
  projectName: string;
  zoneGroups: ZoneGroup[];
}

export interface TeamLoadRow {
  employeeId: string | null; // null = the "unassigned" row
  name: string;
  openCount: number;
}

export interface DepartmentViewData {
  department: { id: string; name: string; name_ar: string | null };
  metrics: DepartmentMetrics;
  projectGroups: ProjectGroup[];
  teamLoad: TeamLoadRow[];
  statusesById: Map<string, StatusRow>;
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
}

const OPEN_CATEGORIES: Database["tasks"]["Enums"]["status_category"][] = ["not_started", "active"];

export function useDepartmentView(departmentId: string | undefined) {
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["department-view", departmentId, user?.id],
    enabled: !!departmentId && !!user?.id,
    queryFn: async (): Promise<DepartmentViewData> => {
      if (!departmentId || !user?.id) throw new Error("missing department or user");

      const { data: department, error: departmentError } = await supabase
        .from("departments")
        .select("id, name, name_ar")
        .eq("id", departmentId)
        .single();
      if (departmentError) throw departmentError;

      const [
        { data: spaces, error: spacesError },
        { data: memberRows, error: membersError },
      ] = await Promise.all([
        tasksDb.from("spaces").select("id, visibility, owner_user_id").eq("is_archived", false),
        tasksDb.from("space_members").select("space_id").eq("user_id", user.id),
      ]);
      if (spacesError) throw spacesError;
      if (membersError) throw membersError;

      const memberSpaceIds = new Set((memberRows ?? []).map((r) => r.space_id));
      const visibleSpaceIds = (spaces ?? [])
        .filter((s) => s.visibility === "public" || s.owner_user_id === user.id || memberSpaceIds.has(s.id))
        .map((s) => s.id);

      const { data: boards, error: boardsError } = visibleSpaceIds.length
        ? await tasksDb.from("boards").select("id").in("space_id", visibleSpaceIds).eq("is_archived", false)
        : { data: [], error: null };
      if (boardsError) throw boardsError;
      const boardIds = (boards ?? []).map((b) => b.id);

      const { data: tasks, error: tasksError } = boardIds.length
        ? await tasksDb
            .from("tasks")
            .select("id, title, board_id, project_id, zone_id, due_date, is_overdue, priority, status_id")
            .in("board_id", boardIds)
            .eq("department_id", departmentId)
            .eq("is_archived", false)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const taskIds = (tasks ?? []).map((t) => t.id);
      const projectIds = Array.from(new Set((tasks ?? []).map((t) => t.project_id)));
      const zoneIds = Array.from(new Set((tasks ?? []).map((t) => t.zone_id).filter(Boolean))) as string[];
      const statusIds = Array.from(new Set((tasks ?? []).map((t) => t.status_id)));

      const [
        { data: assigneeRows, error: assigneeError },
        { data: statusRows, error: statusesError },
        { data: dependencyRows, error: dependencyError },
        { data: projectRows, error: projectsError },
        { data: zoneRows, error: zonesError },
        { data: deptEmployees, error: employeesError },
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        statusIds.length
          ? tasksDb.from("statuses").select("*").in("id", statusIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_dependencies").select("blocked_task_id, blocking_task_id").in("blocked_task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length
          ? supabase.from("projects").select("id, name").in("id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        zoneIds.length
          ? supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name").eq("department_id", departmentId),
      ]);
      if (assigneeError) throw assigneeError;
      if (statusesError) throw statusesError;
      if (dependencyError) throw dependencyError;
      if (projectsError) throw projectsError;
      if (zonesError) throw zonesError;
      if (employeesError) throw employeesError;

      const statusesById = new Map((statusRows ?? []).map((s) => [s.id, s]));
      const isOpen = (statusId: string) => {
        const category = statusesById.get(statusId)?.category;
        return !!category && OPEN_CATEGORIES.includes(category);
      };

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      // Same "still-open blocker" rule as D2 (useTaskBoard) — a dependency
      // only counts once its blocker itself reaches done/closed.
      const blockingIds = Array.from(new Set((dependencyRows ?? []).map((d) => d.blocking_task_id)));
      let openBlockingIds = new Set<string>();
      if (blockingIds.length) {
        const { data: blockingTasks, error: blockingError } = await tasksDb
          .from("tasks")
          .select("id, status_id")
          .in("id", blockingIds);
        if (blockingError) throw blockingError;
        const blockingStatusIds = Array.from(new Set((blockingTasks ?? []).map((t) => t.status_id)));
        const { data: blockingStatuses, error: blockingStatusesError } = blockingStatusIds.length
          ? await tasksDb.from("statuses").select("id, category").in("id", blockingStatusIds)
          : { data: [], error: null };
        if (blockingStatusesError) throw blockingStatusesError;
        const categoryByStatus = new Map((blockingStatuses ?? []).map((s) => [s.id, s.category]));
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
        (dependencyRows ?? [])
          .filter((d) => openBlockingIds.has(d.blocking_task_id))
          .map((d) => d.blocked_task_id),
      );

      const taskList = tasks ?? [];
      let openCount = 0;
      let overdueCount = 0;
      let unassignedCount = 0;
      const openCountByEmployee = new Map<string, number>();

      for (const t of taskList) {
        const open = isOpen(t.status_id);
        if (open) openCount++;
        if (t.is_overdue) overdueCount++;
        const assignees = assigneesByTask.get(t.id) ?? [];
        if (open && assignees.length === 0) unassignedCount++;
        if (open) {
          for (const userId of assignees) {
            openCountByEmployee.set(userId, (openCountByEmployee.get(userId) ?? 0) + 1);
          }
        }
      }

      const metrics: DepartmentMetrics = {
        open: openCount,
        overdue: overdueCount,
        blocked: taskList.filter((t) => blockedTaskIds.has(t.id)).length,
        unassigned: unassignedCount,
      };

      const projectNameById = new Map((projectRows ?? []).map((p) => [p.id, p.name]));
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      const byProject = new Map<string, Map<string | null, TaskLite[]>>();
      for (const t of taskList) {
        const zoneMap = byProject.get(t.project_id) ?? new Map<string | null, TaskLite[]>();
        const list = zoneMap.get(t.zone_id) ?? [];
        list.push(t);
        zoneMap.set(t.zone_id, list);
        byProject.set(t.project_id, zoneMap);
      }
      const projectGroups: ProjectGroup[] = Array.from(byProject.entries()).map(([projectId, zoneMap]) => ({
        projectId,
        projectName: projectNameById.get(projectId) ?? "مشروع",
        zoneGroups: Array.from(zoneMap.entries()).map(([zoneId, tasksInZone]) => ({
          zoneId,
          zoneName: zoneId ? (zoneNameById.get(zoneId) ?? null) : null,
          tasks: tasksInZone,
        })),
      }));

      const teamLoad: TeamLoadRow[] = (deptEmployees ?? [])
        .map((e) => ({
          employeeId: e.id,
          name: `${e.first_name} ${e.last_name ?? ""}`.trim(),
          openCount: openCountByEmployee.get(e.id) ?? 0,
        }))
        .sort((a, b) => b.openCount - a.openCount);
      teamLoad.push({ employeeId: null, name: "غير معين", openCount: unassignedCount });

      return {
        department,
        metrics,
        projectGroups,
        teamLoad,
        statusesById,
        employeesById: new Map((deptEmployees ?? []).map((e) => [e.id, e])),
        assigneesByTask,
      };
    },
  });

  return { data: query.data, loading: query.isPending, error: query.error };
}
