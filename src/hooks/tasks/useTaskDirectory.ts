import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../useAuth";
import { notifyUsers } from "../../services/notifications/pushNotifications";
import type { EmployeeLite, Priority, StatusRow, TagLite, TaskRow, TaskTypeLite } from "./useTaskBoard";

// =====================================================================
// Shared data + mutations for the two company-wide "directory" views —
// AssigneeViewPage (grouped by who's assigned) and TaskTypeViewPage
// (grouped by task type). Both need the SAME full inline-edit power the
// single-board table has (useTaskBoard.ts), but scoped across every
// board/space instead of one — so this is a sibling of useTaskBoard.ts,
// not an extension of it: same mutation shapes (copied from
// useTaskBoard.ts's updateStatus/updateTaskType/updatePriority/
// updateStartDate/updateDueDate/setAssignees), but its own fetch and its
// own query key, since there's no single boardId to key or invalidate by.
//
// Visibility scoping (which spaces count) is the same P8 rule
// useDepartmentView.ts already uses — duplicated here rather than
// shared, matching that file's own stated convention of small per-screen
// query blocks over a shared primitive.
//
// Grouping is deliberately NOT done here — "by assignee" (a task can
// land in more than one bucket) and "by task type" (exactly one bucket)
// are different enough that each page groups this hook's flat task list
// itself.
//
// Every fetched task is returned as-is (no open/closed split here) —
// "open tasks only" is the Status filter's default in
// directoryFilters.ts, applied client-side by the pages against this
// full fetch, so filtering is instant (no refetch) instead of a round
// trip, the same "fetch everything, filter in JS" shape
// useDepartmentView.ts already uses for its own metrics.
// =====================================================================

export interface TaskDirectoryData {
  tasks: TaskRow[];
  statuses: StatusRow[];
  employeesById: Map<string, EmployeeLite>;
  allEmployees: EmployeeLite[];
  assigneesByTask: Map<string, string[]>;
  taskTypes: Map<string, TaskTypeLite>;
  tagsByTask: Map<string, TagLite[]>;
  parentTitleByTask: Map<string, string>;
  projectNamesById: Map<string, string>;
  linkedTaskIds: Set<string>;
  blockedTaskIds: Set<string>;
  unmetRequirementTaskIds: Set<string>;
  attachedTaskIds: Set<string>;
  commentedTaskIds: Set<string>;
}

export function useTaskDirectory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["task-directory", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async (): Promise<TaskDirectoryData> => {
      if (!user?.id) throw new Error("no user");

      const [{ data: spaces, error: spacesError }, { data: memberRows, error: membersError }] = await Promise.all([
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

      const { data: allTasks, error: tasksError } = boardIds.length
        ? await tasksDb.from("tasks").select("*").in("board_id", boardIds).eq("is_archived", false)
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const statusIds = Array.from(new Set((allTasks ?? []).map((t) => t.status_id)));
      const { data: statusRows, error: statusesError } = statusIds.length
        ? await tasksDb.from("statuses").select("*").in("id", statusIds)
        : { data: [], error: null };
      if (statusesError) throw statusesError;

      const tasks = allTasks ?? [];
      const taskIds = tasks.map((t) => t.id);

      const parentIds = Array.from(new Set(tasks.map((t) => t.parent_task_id).filter((id): id is string => !!id)));
      const projectIds = Array.from(new Set(tasks.map((t) => t.project_id).filter((id): id is string => !!id)));

      const [
        { data: assigneeRows, error: assigneeError },
        { data: employees, error: employeesError },
        { data: taskTypeRows, error: taskTypesError },
        linksResult,
        dependenciesResult,
        requirementsResult,
        attachmentsResult,
        commentsResult,
        taskTagsResult,
        parentRowsResult,
        projectRowsResult,
      ] = await Promise.all([
        taskIds.length
          ? tasksDb.from("task_assignees").select("task_id, user_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("employees").select("id, first_name, last_name"),
        tasksDb.from("task_types").select("id, name_ar, color").order("name_ar"),
        taskIds.length
          ? tasksDb.from("task_links").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_dependencies").select("blocked_task_id, blocking_task_id").in("blocked_task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_requirements").select("task_id").in("task_id", taskIds).eq("is_satisfied", false)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? supabase.from("attachments").select("entity_id").eq("entity_type", "task").in("entity_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_comments").select("task_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        taskIds.length
          ? tasksDb.from("task_tags").select("task_id, tag_id").in("task_id", taskIds)
          : Promise.resolve({ data: [], error: null }),
        parentIds.length
          ? tasksDb.from("tasks").select("id, title").in("id", parentIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length
          ? supabase.from("projects").select("id, name").in("id", projectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (assigneeError) throw assigneeError;
      if (employeesError) throw employeesError;
      if (taskTypesError) throw taskTypesError;
      if (linksResult.error) throw linksResult.error;
      if (dependenciesResult.error) throw dependenciesResult.error;
      if (requirementsResult.error) throw requirementsResult.error;
      if (attachmentsResult.error) throw attachmentsResult.error;
      if (commentsResult.error) throw commentsResult.error;
      if (taskTagsResult.error) throw taskTagsResult.error;
      if (parentRowsResult.error) throw parentRowsResult.error;
      if (projectRowsResult.error) throw projectRowsResult.error;

      const attachedTagIds = Array.from(new Set((taskTagsResult.data ?? []).map((r) => r.tag_id)));
      const { data: tagRows, error: tagsError } = attachedTagIds.length
        ? await tasksDb.from("tags").select("id, name, color").in("id", attachedTagIds)
        : { data: [], error: null };
      if (tagsError) throw tagsError;

      const tagById = new Map((tagRows ?? []).map((t) => [t.id, t]));
      const tagsByTask = new Map<string, TagLite[]>();
      for (const row of taskTagsResult.data ?? []) {
        const tag = tagById.get(row.tag_id);
        if (!tag) continue;
        const list = tagsByTask.get(row.task_id) ?? [];
        list.push(tag);
        tagsByTask.set(row.task_id, list);
      }

      const assigneesByTask = new Map<string, string[]>();
      for (const row of assigneeRows ?? []) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push(row.user_id);
        assigneesByTask.set(row.task_id, list);
      }

      const parentTitleByTask = new Map<string, string>();
      for (const t of tasks) {
        if (!t.parent_task_id) continue;
        const parent = (parentRowsResult.data ?? []).find((p) => p.id === t.parent_task_id);
        if (parent) parentTitleByTask.set(t.id, parent.title);
      }

      // Same "still-open blocker" rule as useTaskBoard.ts/useDepartmentView.ts.
      const blockingIds = Array.from(new Set((dependenciesResult.data ?? []).map((d) => d.blocking_task_id)));
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
        (dependenciesResult.data ?? []).filter((d) => openBlockingIds.has(d.blocking_task_id)).map((d) => d.blocked_task_id),
      );

      return {
        tasks,
        statuses: statusRows ?? [],
        employeesById: new Map((employees ?? []).map((e) => [e.id, e])),
        allEmployees: employees ?? [],
        assigneesByTask,
        taskTypes: new Map((taskTypeRows ?? []).map((t) => [t.id, t])),
        tagsByTask,
        parentTitleByTask,
        projectNamesById: new Map((projectRowsResult.data ?? []).map((p) => [p.id, p.name])),
        linkedTaskIds: new Set((linksResult.data ?? []).map((r) => r.task_id)),
        blockedTaskIds,
        unmetRequirementTaskIds: new Set((requirementsResult.data ?? []).map((r) => r.task_id)),
        attachedTaskIds: new Set((attachmentsResult.data ?? []).map((a) => a.entity_id)),
        commentedTaskIds: new Set((commentsResult.data ?? []).map((c) => c.task_id)),
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      const { error } = await tasksDb.from("tasks").update({ status_id: statusId }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTaskType = useMutation({
    mutationFn: async ({ taskId, taskTypeId }: { taskId: string; taskTypeId: string }) => {
      const { error } = await tasksDb.from("tasks").update({ task_type_id: taskTypeId }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePriority = useMutation({
    mutationFn: async ({ taskId, priority }: { taskId: string; priority: Priority | null }) => {
      const { error } = await tasksDb.from("tasks").update({ priority }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStartDate = useMutation({
    mutationFn: async ({ taskId, startDate }: { taskId: string; startDate: string | null }) => {
      const { error } = await tasksDb.from("tasks").update({ start_date: startDate }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateDueDate = useMutation({
    mutationFn: async ({ taskId, dueDate }: { taskId: string; dueDate: string | null }) => {
      const { error } = await tasksDb.from("tasks").update({ due_date: dueDate }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setAssignees = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      const current = query.data?.assigneesByTask.get(taskId) ?? [];
      const toAdd = userIds.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !userIds.includes(id));

      if (toRemove.length) {
        const { error } = await tasksDb.from("task_assignees").delete().eq("task_id", taskId).in("user_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length && user?.id) {
        const { error } = await tasksDb
          .from("task_assignees")
          .insert(toAdd.map((userId) => ({ task_id: taskId, user_id: userId, assigned_by: user.id })));
        if (error) throw error;

        const recipients = toAdd.filter((id) => id !== user.id);
        if (recipients.length > 0) {
          const taskTitle = query.data?.tasks.find((t) => t.id === taskId)?.title ?? "مهمة";
          void notifyUsers(recipients, "تم تكليفك بمهمة جديدة", taskTitle, { url: `/tasks/${taskId}` });
        }
      }
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    onChangeStatus: (taskId: string, statusId: string) => updateStatus.mutate({ taskId, statusId }),
    onChangeTaskType: (taskId: string, taskTypeId: string) => updateTaskType.mutate({ taskId, taskTypeId }),
    onChangePriority: (taskId: string, priority: Priority | null) => updatePriority.mutate({ taskId, priority }),
    onChangeStartDate: (taskId: string, startDate: string | null) => updateStartDate.mutate({ taskId, startDate }),
    onChangeDueDate: (taskId: string, dueDate: string | null) => updateDueDate.mutate({ taskId, dueDate }),
    onChangeAssignees: (taskId: string, userIds: string[]) => setAssignees.mutate({ taskId, userIds }),
  };
}
