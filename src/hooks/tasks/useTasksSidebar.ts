import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";

// =====================================================================
// D1 sidebar data — one query, everything the sidebar chrome needs.
// =====================================================================
// No permission_catalog wiring yet (Part 6 of the build plan is
// deliberately deferred — see TasksRoutes.tsx). What IS enforced here is
// P8 (default-private for spaces): a `private` space only shows if the
// current user owns it (personal spaces) or has a space_members row.
// `public` spaces show to anyone who reached /tasks at all, same as
// every other still-ungated section (CRM, Supply Chain, ...).
//
// Open counts are computed client-side from raw (board_id, status_id)
// pairs rather than a SQL aggregate, since there's no view/RPC for it
// yet. Fine at today's data volume; revisit with a real view/RPC later.

type SpaceRow = Database["tasks"]["Tables"]["spaces"]["Row"];
type FolderRow = Database["tasks"]["Tables"]["folders"]["Row"];
type BoardRow = Database["tasks"]["Tables"]["boards"]["Row"];
export type SpaceType = Database["tasks"]["Enums"]["space_type"];
type StatusCategory = Database["tasks"]["Enums"]["status_category"];

export interface BoardWithCount {
  board: BoardRow;
  openCount: number;
  zoneName: string | null;
}

export interface FolderNode {
  folder: FolderRow;
  boards: BoardWithCount[];
}

export interface SpaceNode {
  space: SpaceRow;
  folders: FolderNode[];
  boards: BoardWithCount[]; // directly under the space (folder_id null)
}

export interface DepartmentShortcut {
  id: string;
  name: string;
  name_ar: string | null;
  openCount: number;
}

export interface TasksSidebarData {
  spacesByType: Record<SpaceType, SpaceNode[]>;
  departments: DepartmentShortcut[];
  myWorkCount: number;
}

const OPEN_CATEGORIES: StatusCategory[] = ["not_started", "active"];

export function useTasksSidebar() {
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");

  const query = useQuery({
    queryKey: ["tasks-sidebar", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TasksSidebarData> => {
      if (!user?.id) throw new Error("no authenticated user");
      const userId = user.id;

      const [
        { data: spaces, error: spacesError },
        { data: memberRows, error: membersError },
        { data: departmentRows, error: departmentsError },
        { data: assigneeRows, error: assigneeError },
      ] = await Promise.all([
        tasksDb.from("spaces").select("*").eq("is_archived", false),
        tasksDb
          .from("space_members")
          .select("space_id")
          .eq("user_id", userId),
        supabase
          .from("departments")
          .select("id, name, name_ar")
          .eq("is_active", true),
        tasksDb.from("task_assignees").select("task_id").eq("user_id", userId),
      ]);

      if (spacesError) throw spacesError;
      if (membersError) throw membersError;
      if (departmentsError) throw departmentsError;
      if (assigneeError) throw assigneeError;

      const memberSpaceIds = new Set(
        (memberRows ?? []).map((row) => row.space_id),
      );

      const visibleSpaces = (spaces ?? []).filter(
        (space) =>
          space.visibility === "public" ||
          space.owner_user_id === userId ||
          memberSpaceIds.has(space.id),
      );
      const visibleSpaceIds = visibleSpaces.map((s) => s.id);

      const [
        { data: folders, error: foldersError },
        { data: boards, error: boardsError },
      ] =
        visibleSpaceIds.length === 0
          ? [{ data: [], error: null }, { data: [], error: null }]
          : await Promise.all([
              tasksDb
                .from("folders")
                .select("*")
                .in("space_id", visibleSpaceIds)
                .eq("is_archived", false),
              tasksDb
                .from("boards")
                .select("*")
                .in("space_id", visibleSpaceIds)
                .eq("is_archived", false),
            ]);

      if (foldersError) throw foldersError;
      if (boardsError) throw boardsError;

      const boardIds = (boards ?? []).map((b) => b.id);
      const myTaskIds = (assigneeRows ?? []).map((r) => r.task_id);

      // (board_id, status_id, department_id) for every non-archived task
      // on a visible board, plus every task assigned to me (which may sit
      // on a board I can't otherwise see — the count should still count).
      const relevantTaskRows: { board_id: string; status_id: string }[] = [];
      const departmentTaskRows: {
        department_id: string | null;
        status_id: string;
      }[] = [];

      if (boardIds.length > 0) {
        const { data, error } = await tasksDb
          .from("tasks")
          .select("board_id, status_id, department_id")
          .in("board_id", boardIds)
          .eq("is_archived", false);
        if (error) throw error;
        for (const row of data ?? []) {
          relevantTaskRows.push({
            board_id: row.board_id,
            status_id: row.status_id,
          });
          departmentTaskRows.push({
            department_id: row.department_id,
            status_id: row.status_id,
          });
        }
      }

      let myOpenTaskStatusIds: string[] = [];
      if (myTaskIds.length > 0) {
        const { data, error } = await tasksDb
          .from("tasks")
          .select("status_id")
          .in("id", myTaskIds)
          .eq("is_archived", false);
        if (error) throw error;
        myOpenTaskStatusIds = (data ?? []).map((r) => r.status_id);
      }

      const allStatusIds = new Set<string>([
        ...relevantTaskRows.map((r) => r.status_id),
        ...myOpenTaskStatusIds,
      ]);

      let categoryByStatusId = new Map<string, StatusCategory>();
      if (allStatusIds.size > 0) {
        const { data: statuses, error: statusesError } = await tasksDb
          .from("statuses")
          .select("id, category")
          .in("id", Array.from(allStatusIds));
        if (statusesError) throw statusesError;
        categoryByStatusId = new Map(
          (statuses ?? []).map((s) => [s.id, s.category]),
        );
      }

      const isOpen = (statusId: string) => {
        const category = categoryByStatusId.get(statusId);
        return !!category && OPEN_CATEGORIES.includes(category);
      };

      const openCountByBoard = new Map<string, number>();
      for (const row of relevantTaskRows) {
        if (!isOpen(row.status_id)) continue;
        openCountByBoard.set(
          row.board_id,
          (openCountByBoard.get(row.board_id) ?? 0) + 1,
        );
      }

      const openCountByDepartment = new Map<string, number>();
      for (const row of departmentTaskRows) {
        if (!row.department_id || !isOpen(row.status_id)) continue;
        openCountByDepartment.set(
          row.department_id,
          (openCountByDepartment.get(row.department_id) ?? 0) + 1,
        );
      }

      const myWorkCount = myOpenTaskStatusIds.filter(isOpen).length;

      const zoneIds = Array.from(new Set((boards ?? []).map((b) => b.zone_id).filter(Boolean))) as string[];
      const { data: zoneRows, error: zonesError } = zoneIds.length
        ? await supabase.schema("boq").from("zones").select("id, name").in("id", zoneIds)
        : { data: [], error: null };
      if (zonesError) throw zonesError;
      const zoneNameById = new Map((zoneRows ?? []).map((z) => [z.id, z.name]));

      const boardsWithCount: BoardWithCount[] = (boards ?? []).map((b) => ({
        board: b,
        openCount: openCountByBoard.get(b.id) ?? 0,
        zoneName: b.zone_id ? (zoneNameById.get(b.zone_id) ?? null) : null,
      }));

      const spaceNodes: SpaceNode[] = visibleSpaces.map((space) => {
        const spaceBoards = boardsWithCount.filter(
          (b) => b.board.space_id === space.id,
        );
        const spaceFolders = (folders ?? []).filter(
          (f) => f.space_id === space.id,
        );

        return {
          space,
          boards: spaceBoards.filter((b) => !b.board.folder_id),
          folders: spaceFolders.map((folder) => ({
            folder,
            boards: spaceBoards.filter(
              (b) => b.board.folder_id === folder.id,
            ),
          })),
        };
      });

      const spacesByType: Record<SpaceType, SpaceNode[]> = {
        project: [],
        department: [],
        company: [],
        personal: [],
      };
      for (const node of spaceNodes) {
        spacesByType[node.space.space_type].push(node);
      }

      const departments: DepartmentShortcut[] = (departmentRows ?? [])
        .map((d) => ({
          id: d.id,
          name: d.name,
          name_ar: d.name_ar,
          openCount: openCountByDepartment.get(d.id) ?? 0,
        }))
        .sort((a, b) => (a.name_ar ?? a.name).localeCompare(b.name_ar ?? b.name));

      return { spacesByType, departments, myWorkCount };
    },
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
  };
}
