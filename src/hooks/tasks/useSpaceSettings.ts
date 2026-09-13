import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database, Json } from "../../lib/supabase";

// =====================================================================
// D9 — Space settings (build plan Part 7, §4.1/4.2).
// =====================================================================
// `settings` is read/written as one JSON blob per the plan's own note
// ("read as a whole every time and never queried by key"):
// {time_tracking, priorities, task_types, default_view}.

export type Space = Database["tasks"]["Tables"]["spaces"]["Row"];
export type StatusRow = Database["tasks"]["Tables"]["statuses"]["Row"];
type AccessLevel = Database["tasks"]["Enums"]["access_level"];
type StatusCategory = Database["tasks"]["Enums"]["status_category"];

export interface SpaceFeatureSettings {
  time_tracking: boolean;
  priorities: boolean;
  task_types: boolean;
  default_view: "list" | "board";
}

export const DEFAULT_FEATURE_SETTINGS: SpaceFeatureSettings = {
  time_tracking: false,
  priorities: true,
  task_types: true,
  default_view: "list",
};

export interface MemberLite {
  id: string; // space_members.id
  userId: string;
  name: string;
  accessLevel: AccessLevel;
}

export interface BoardLite {
  id: string;
  name: string;
  zoneId: string | null;
  zoneName: string | null;
  departmentId: string | null;
  folderId: string | null;
  taskCount: number;
}

export interface FolderLite {
  id: string;
  name: string;
  boardCount: number;
}

export interface SpaceSettingsData {
  space: Space;
  members: MemberLite[];
  employees: { id: string; name: string }[];
  statuses: StatusRow[];
  statusSetIsSpaceOwned: boolean;
  boards: BoardLite[];
  folders: FolderLite[];
}

export function useSpaceSettings(spaceId: string | undefined) {
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["space-settings", spaceId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    enabled: !!spaceId,
    queryFn: async (): Promise<SpaceSettingsData> => {
      if (!spaceId) throw new Error("no space id");

      const { data: space, error: spaceError } = await tasksDb.from("spaces").select("*").eq("id", spaceId).single();
      if (spaceError) throw spaceError;

      const [
        { data: memberRows, error: membersError },
        { data: employeeRows, error: employeesError },
      ] = await Promise.all([
        tasksDb.from("space_members").select("id, user_id, access_level").eq("space_id", spaceId),
        supabase.from("employees").select("id, first_name, last_name"),
      ]);
      if (membersError) throw membersError;
      if (employeesError) throw employeesError;

      const employeeNameById = new Map((employeeRows ?? []).map((e) => [e.id, `${e.first_name} ${e.last_name ?? ""}`.trim()]));

      let statusSetId = space.status_set_id;
      const statusSetIsSpaceOwned = !!statusSetId;
      if (!statusSetId) {
        const { data: globalSet, error: globalError } = await tasksDb
          .from("status_sets")
          .select("id")
          .is("space_id", null)
          .eq("is_default", true)
          .single();
        if (globalError) throw globalError;
        statusSetId = globalSet.id;
      }

      const { data: statuses, error: statusesError } = await tasksDb
        .from("statuses")
        .select("*")
        .eq("status_set_id", statusSetId)
        .order("sort_order");
      if (statusesError) throw statusesError;

      const [
        { data: boardRows, error: boardsError },
        { data: folderRows, error: foldersError },
      ] = await Promise.all([
        tasksDb.from("boards").select("id, name, zone_id, department_id, folder_id").eq("space_id", spaceId).eq("is_archived", false),
        tasksDb.from("folders").select("id, name").eq("space_id", spaceId).eq("is_archived", false),
      ]);
      if (boardsError) throw boardsError;
      if (foldersError) throw foldersError;

      const boardIds = (boardRows ?? []).map((b) => b.id);
      const zoneIds = Array.from(new Set((boardRows ?? []).map((b) => b.zone_id).filter(Boolean))) as string[];
      const [
        { data: taskRows, error: tasksError },
        { data: zoneRows, error: zoneError },
      ] = await Promise.all([
        boardIds.length
          ? tasksDb.from("tasks").select("board_id").in("board_id", boardIds).eq("is_archived", false)
          : Promise.resolve({ data: [], error: null }),
        zoneIds.length
          ? supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (tasksError) throw tasksError;
      if (zoneError) throw zoneError;

      const taskCountByBoard = new Map<string, number>();
      for (const row of taskRows ?? []) {
        taskCountByBoard.set(row.board_id, (taskCountByBoard.get(row.board_id) ?? 0) + 1);
      }
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      const boardCountByFolder = new Map<string, number>();
      for (const row of boardRows ?? []) {
        if (!row.folder_id) continue;
        boardCountByFolder.set(row.folder_id, (boardCountByFolder.get(row.folder_id) ?? 0) + 1);
      }

      return {
        space,
        members: (memberRows ?? []).map((m) => ({
          id: m.id,
          userId: m.user_id,
          name: employeeNameById.get(m.user_id) ?? "مستخدم",
          accessLevel: m.access_level,
        })),
        employees: (employeeRows ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name ?? ""}`.trim() })),
        statuses: statuses ?? [],
        statusSetIsSpaceOwned,
        boards: (boardRows ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          zoneId: b.zone_id,
          zoneName: b.zone_id ? (zoneNameById.get(b.zone_id) ?? null) : null,
          departmentId: b.department_id,
          folderId: b.folder_id,
          taskCount: taskCountByBoard.get(b.id) ?? 0,
        })),
        folders: (folderRows ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          boardCount: boardCountByFolder.get(f.id) ?? 0,
        })),
      };
    },
  });

  const updateSpace = useMutation({
    mutationFn: async (patch: Partial<Pick<Space, "name" | "description" | "visibility">>) => {
      if (!spaceId) throw new Error("no space id");
      const { error } = await tasksDb.from("spaces").update(patch).eq("id", spaceId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateFeatureSettings = useMutation({
    mutationFn: async (settings: SpaceFeatureSettings) => {
      if (!spaceId) throw new Error("no space id");
      const { error } = await tasksDb.from("spaces").update({ settings: settings as unknown as Json }).eq("id", spaceId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addMember = useMutation({
    mutationFn: async ({ userId, accessLevel }: { userId: string; accessLevel: AccessLevel }) => {
      if (!spaceId) throw new Error("no space id");
      const { error } = await tasksDb.from("space_members").insert({ space_id: spaceId, user_id: userId, access_level: accessLevel });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMemberAccess = useMutation({
    mutationFn: async ({ memberId, accessLevel }: { memberId: string; accessLevel: AccessLevel }) => {
      const { error } = await tasksDb.from("space_members").update({ access_level: accessLevel }).eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await tasksDb.from("space_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createOwnStatusSet = useMutation({
    mutationFn: async () => {
      if (!spaceId || !query.data) throw new Error("space not loaded");
      const { data: newSet, error: setError } = await tasksDb
        .from("status_sets")
        .insert({ name: `${query.data.space.name} - حالات`, space_id: spaceId, is_default: false })
        .select("id")
        .single();
      if (setError) throw setError;

      const clonedStatuses = query.data.statuses.map((s) => ({
        status_set_id: newSet.id,
        label: s.label,
        label_ar: s.label_ar,
        category: s.category,
        color: s.color,
        sort_order: s.sort_order,
      }));
      if (clonedStatuses.length) {
        const { error: statusesError } = await tasksDb.from("statuses").insert(clonedStatuses);
        if (statusesError) throw statusesError;
      }

      const { error: spaceError } = await tasksDb.from("spaces").update({ status_set_id: newSet.id }).eq("id", spaceId);
      if (spaceError) throw spaceError;
    },
    onSuccess: invalidate,
  });

  const addStatus = useMutation({
    mutationFn: async (input: { labelAr: string; category: StatusCategory }) => {
      if (!query.data) throw new Error("space not loaded");
      const statusSetId = query.data.statuses[0]?.status_set_id ?? query.data.space.status_set_id;
      if (!statusSetId) throw new Error("لا توجد مجموعة حالات خاصة بهذه المساحة بعد");
      const maxSort = query.data.statuses.reduce((m, s) => Math.max(m, s.sort_order), -1);
      const { error } = await tasksDb.from("statuses").insert({
        status_set_id: statusSetId,
        label: input.labelAr,
        label_ar: input.labelAr,
        category: input.category,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<StatusRow> }) => {
      const { error } = await tasksDb.from("statuses").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Archive, not hard delete — spaces.is_archived is already filtered on
  // everywhere a space list is read (useTasksSidebar, useDepartmentView,
  // the /tasks landing page), so this is a safe, already-respected
  // soft-delete: the space just stops appearing anywhere, nothing about
  // its boards/tasks is touched or lost.
  const archiveSpace = useMutation({
    mutationFn: async () => {
      if (!spaceId) throw new Error("no space id");
      const { error } = await tasksDb.from("spaces").update({ is_archived: true }).eq("id", spaceId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await tasksDb.from("folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Same archive-not-delete reasoning as archiveSpace, plus one extra
  // step: folders.is_archived is filtered when building the sidebar tree,
  // and a board still pointing at a now-hidden folder_id would vanish
  // from that tree entirely (shows under neither the folder nor the
  // space) — so boards inside are un-filed (folder_id → null) first,
  // which keeps them visible directly under the space.
  const archiveFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error: unfileError } = await tasksDb.from("boards").update({ folder_id: null }).eq("folder_id", id);
      if (unfileError) throw unfileError;
      const { error } = await tasksDb.from("folders").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateBoard = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{ name: string; zone_id: string | null; department_id: string | null; folder_id: string | null }>;
    }) => {
      const { error } = await tasksDb.from("boards").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    updateSpace: updateSpace.mutateAsync,
    archiveSpace: archiveSpace.mutateAsync,
    updateFeatureSettings: updateFeatureSettings.mutateAsync,
    addMember: addMember.mutateAsync,
    updateMemberAccess: updateMemberAccess.mutateAsync,
    removeMember: removeMember.mutateAsync,
    createOwnStatusSet: createOwnStatusSet.mutateAsync,
    creatingStatusSet: createOwnStatusSet.isPending,
    addStatus: addStatus.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    deleteStatus: deleteStatus.mutateAsync,
    updateBoard: updateBoard.mutateAsync,
    deleteBoard: deleteBoard.mutateAsync,
    renameFolder: renameFolder.mutateAsync,
    archiveFolder: archiveFolder.mutateAsync,
  };
}
