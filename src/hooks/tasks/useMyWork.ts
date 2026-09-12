import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";
import { resolveStatusSetId } from "./resolveStatusSetId";
import type { StatusRow } from "./useTaskBoard";

// =====================================================================
// D7 — My work (build plan Part 7).
// =====================================================================
// Grouped by source_template_task_id, not by board/project — the point
// (per build plan) is "all my copies of this one blueprint task across
// every zone/floor" in one place, since that's the shape of the actual
// work (do the same physical task on every floor, then batch-close the
// whole set at once). Tasks with no source_template_task_id (created by
// hand, not via template/clone) fall into one shared "أخرى" bucket
// rather than one singleton group each — that's still a defensible
// batch target (e.g. "close everything ad-hoc I've finished").
//
// This intentionally does NOT scope by space visibility the way D1's
// sidebar or D6 does — a task assigned to you counts here even if you
// can no longer see its board's space (same reasoning as the sidebar's
// own myWorkCount comment).

export type MyWorkTask = Pick<
  Database["tasks"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "board_id" | "project_id" | "zone_id" | "due_date" | "is_overdue" | "priority" | "status_id" | "source_template_task_id"
>;

export interface MyWorkGroup {
  key: string;
  label: string;
  tasks: MyWorkTask[];
}

export interface MyWorkData {
  groups: MyWorkGroup[];
  statusesById: Map<string, StatusRow>;
  projectNamesById: Map<string, string>;
  zoneNamesById: Map<string, string>;
  boardsById: Map<string, { id: string; status_set_id: string | null; space_id: string }>;
}

const OPEN_CATEGORIES: Database["tasks"]["Enums"]["status_category"][] = ["not_started", "active"];

function dueTime(task: MyWorkTask): number {
  return task.due_date ? new Date(task.due_date).getTime() : Infinity;
}

export function useMyWork() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["my-work", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async (): Promise<MyWorkData> => {
      if (!user?.id) throw new Error("no authenticated user");

      const { data: assigneeRows, error: assigneeError } = await tasksDb
        .from("task_assignees")
        .select("task_id")
        .eq("user_id", user.id);
      if (assigneeError) throw assigneeError;
      const taskIds = (assigneeRows ?? []).map((r) => r.task_id);

      const { data: tasks, error: tasksError } = taskIds.length
        ? await tasksDb
            .from("tasks")
            .select(
              "id, title, board_id, project_id, zone_id, due_date, is_overdue, priority, status_id, source_template_task_id",
            )
            .in("id", taskIds)
            .eq("is_archived", false)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const boardIds = Array.from(new Set((tasks ?? []).map((t) => t.board_id)));
      const projectIds = Array.from(new Set((tasks ?? []).map((t) => t.project_id)));
      const zoneIds = Array.from(new Set((tasks ?? []).map((t) => t.zone_id).filter(Boolean))) as string[];
      const statusIds = Array.from(new Set((tasks ?? []).map((t) => t.status_id)));
      const templateTaskIds = Array.from(
        new Set((tasks ?? []).map((t) => t.source_template_task_id).filter(Boolean)),
      ) as string[];

      const [
        { data: boardRows, error: boardsError },
        { data: projectRows, error: projectsError },
        { data: zoneRows, error: zonesError },
        { data: statusRows, error: statusesError },
        { data: templateTaskRows, error: templateTasksError },
      ] = await Promise.all([
        boardIds.length
          ? tasksDb.from("boards").select("id, status_set_id, space_id").in("id", boardIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length
          ? supabase.from("projects").select("id, name").in("id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        zoneIds.length
          ? supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
          : Promise.resolve({ data: [], error: null }),
        statusIds.length
          ? tasksDb.from("statuses").select("*").in("id", statusIds)
          : Promise.resolve({ data: [], error: null }),
        templateTaskIds.length
          ? tasksDb.from("template_tasks").select("id, title_ar").in("id", templateTaskIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (boardsError) throw boardsError;
      if (projectsError) throw projectsError;
      if (zonesError) throw zonesError;
      if (statusesError) throw statusesError;
      if (templateTasksError) throw templateTasksError;

      const statusesById = new Map((statusRows ?? []).map((s) => [s.id, s]));
      const isOpen = (statusId: string) => {
        const category = statusesById.get(statusId)?.category;
        return !!category && OPEN_CATEGORIES.includes(category);
      };

      const openTasks = (tasks ?? []).filter((t) => isOpen(t.status_id));
      const templateTitleById = new Map((templateTaskRows ?? []).map((t) => [t.id, t.title_ar]));

      const byKey = new Map<string, MyWorkTask[]>();
      for (const t of openTasks) {
        const key = t.source_template_task_id ?? "other";
        const list = byKey.get(key) ?? [];
        list.push(t);
        byKey.set(key, list);
      }

      const groups: MyWorkGroup[] = Array.from(byKey.entries())
        .map(([key, groupTasks]) => ({
          key,
          label: key === "other" ? "أخرى" : (templateTitleById.get(key) ?? "مهمة متكررة"),
          tasks: groupTasks.sort((a, b) => dueTime(a) - dueTime(b)),
        }))
        .sort((a, b) => dueTime(a.tasks[0]) - dueTime(b.tasks[0]));

      return {
        groups,
        statusesById,
        projectNamesById: new Map((projectRows ?? []).map((p) => [p.id, p.name])),
        zoneNamesById: new Map((zoneRows ?? []).map((z) => [z.id, z.name])),
        boardsById: new Map((boardRows ?? []).map((b) => [b.id, b])),
      };
    },
  });

  const markGroupDone = useMutation({
    mutationFn: async (groupTasks: MyWorkTask[]) => {
      if (!query.data) throw new Error("my work not loaded");
      const { boardsById } = query.data;

      const taskIdsByBoard = new Map<string, string[]>();
      for (const t of groupTasks) {
        const list = taskIdsByBoard.get(t.board_id) ?? [];
        list.push(t.id);
        taskIdsByBoard.set(t.board_id, list);
      }

      for (const [boardId, ids] of taskIdsByBoard) {
        const board = boardsById.get(boardId);
        if (!board) continue;
        const statusSetId = await resolveStatusSetId(board.status_set_id, board.space_id);
        const { data: doneStatus, error: doneStatusError } = await tasksDb
          .from("statuses")
          .select("id")
          .eq("status_set_id", statusSetId)
          .eq("category", "done")
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (doneStatusError) throw doneStatusError;
        if (!doneStatus) continue;

        const { error } = await tasksDb.from("tasks").update({ status_id: doneStatus.id }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    markGroupDone: markGroupDone.mutateAsync,
    markingDone: markGroupDone.isPending,
  };
}
