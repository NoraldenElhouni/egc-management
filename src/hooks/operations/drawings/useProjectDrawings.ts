import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import {
  filesApiDelete,
  filesApiDownload,
  filesApiUpload,
} from "../../../lib/filesApiClient";
import type { Json } from "../../../lib/supabase";
import { useAuthUserId } from "../../permissions/useCan";
import type {
  DrawingAccess,
  DrawingFolder,
  DrawingNotice,
  DrawingVersion,
  MapType,
} from "../../../types/global.type";

// =====================================================================
// PROJECT DRAWINGS — /operations/maps/project/:projectId
// =====================================================================
// One folder per map type (map_types) per project. Each folder holds
// numbered versions of a drawing file, a status, and "must comply"
// notices to and from other folders. Schema, RLS and RPCs:
// supabase/migrations/20261020120000_project_drawings.sql.
//
// Files are NOT in Supabase Storage. Uploads, downloads and deletes go
// through the EGC files service (lib/filesApiClient.ts); everything else
// is plain Supabase. Permissions are decided by the database either way:
// project_drawing_my_caps() tells the UI what to show, and RLS / the RPCs
// enforce the same rules.
// =====================================================================

export type DrawingStatus = "ok" | "design" | "modification";

export interface FolderCaps {
  view: boolean;
  download: boolean;
  upload: boolean;
  edit: boolean;
}

export interface DrawingCaps {
  is_manager: boolean;
  folders: Record<string, FolderCaps>;
}

const NO_CAPS: FolderCaps = { view: false, download: false, upload: false, edit: false };
export const capsFor = (caps: DrawingCaps | undefined, folderId: string): FolderCaps =>
  caps?.folders[folderId] ?? NO_CAPS;

export interface DrawingFolderRow extends DrawingFolder {
  name: string;
  statusByName: string | null;
  latest: Pick<DrawingVersion, "id" | "version" | "created_at" | "file_name"> | null;
}

export interface DrawingVersionRow extends DrawingVersion {
  uploaderName: string | null;
}

export const drawingKeys = {
  all: (projectId: string) => ["project-drawings", projectId],
  caps: (projectId: string, userId: string | null) => ["project-drawings", projectId, "caps", userId ?? "anonymous"],
  folders: (projectId: string) => ["project-drawings", projectId, "folders"],
  notices: (projectId: string) => ["project-drawings", projectId, "notices"],
  versions: (projectId: string, folderId: string) => ["project-drawings", projectId, "versions", folderId],
  access: (projectId: string, folderId: string) => ["project-drawings", projectId, "access", folderId],
  mapTypes: ["project-drawings", "map-types"],
};

type NameRow = { first_name: string | null; last_name: string | null } | null;
const personName = (u: NameRow) => (u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || null : null);

function toError(error: { message: string; code?: string }, fallback: string): Error {
  if (error.code === "23505") return new Error("نوع الخريطة هذا موجود بالفعل في المشروع");
  if (error.code === "42501") return new Error(error.message || "ليست لديك صلاحية لهذه العملية");
  return new Error(error.message || fallback);
}

// ---------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------

export function useMyDrawingCaps(projectId: string | undefined) {
  const { userId, resolved } = useAuthUserId();
  return useQuery({
    queryKey: drawingKeys.caps(projectId ?? "", userId),
    enabled: !!projectId && resolved && !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<DrawingCaps> => {
      const { data, error } = await supabase.rpc("project_drawing_my_caps", {
        p_project_id: projectId as string,
      });
      if (error) throw toError(error, "تعذر تحميل الصلاحيات");
      const caps = (data ?? {}) as Partial<DrawingCaps>;
      return { is_manager: !!caps.is_manager, folders: caps.folders ?? {} };
    },
  });
}

/** Every folder of the project the user takes part in, with its latest
 * version (when the user may view that folder). Sorted by name. */
export function useDrawingFolders(projectId: string | undefined) {
  return useQuery({
    queryKey: drawingKeys.folders(projectId ?? ""),
    enabled: !!projectId,
    queryFn: async (): Promise<DrawingFolderRow[]> => {
      const { data: folders, error } = await supabase
        .from("project_drawing_folders")
        .select(
          "*, map_type:map_types(name), status_user:users!project_drawing_folders_status_by_fkey(first_name, last_name)",
        )
        .eq("project_id", projectId as string);
      if (error) throw toError(error, "تعذر تحميل أنواع الخرائط");

      const ids = (folders ?? []).map((f) => f.id);
      const latest = new Map<string, DrawingFolderRow["latest"]>();
      if (ids.length) {
        // RLS only returns versions of folders the user may view.
        const { data: versions, error: vError } = await supabase
          .from("project_drawing_versions")
          .select("id, folder_id, version, created_at, file_name")
          .in("folder_id", ids)
          .order("version", { ascending: false });
        if (vError) throw toError(vError, "تعذر تحميل الإصدارات");
        for (const v of versions ?? []) {
          if (!latest.has(v.folder_id)) latest.set(v.folder_id, v);
        }
      }

      return (folders ?? [])
        .map(({ map_type, status_user, ...f }) => ({
          ...f,
          name: map_type?.name ?? "—",
          statusByName: personName(status_user as NameRow),
          latest: latest.get(f.id) ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "ar"));
    },
  });
}

/** Notices the user can see in this project (to or from a viewable folder). */
export function useDrawingNotices(projectId: string | undefined) {
  return useQuery({
    queryKey: drawingKeys.notices(projectId ?? ""),
    enabled: !!projectId,
    queryFn: async (): Promise<DrawingNotice[]> => {
      const { data, error } = await supabase
        .from("project_drawing_notices")
        .select("*")
        .eq("project_id", projectId as string)
        .order("created_at", { ascending: false });
      if (error) throw toError(error, "تعذر تحميل الإشعارات");
      return data ?? [];
    },
  });
}

export function useDrawingVersions(projectId: string | undefined, folderId: string | undefined) {
  return useQuery({
    queryKey: drawingKeys.versions(projectId ?? "", folderId ?? ""),
    enabled: !!projectId && !!folderId,
    queryFn: async (): Promise<DrawingVersionRow[]> => {
      const { data, error } = await supabase
        .from("project_drawing_versions")
        .select("*, uploader:users!project_drawing_versions_uploaded_by_fkey(first_name, last_name)")
        .eq("folder_id", folderId as string)
        .order("version", { ascending: false });
      if (error) throw toError(error, "تعذر تحميل الإصدارات");
      return (data ?? []).map(({ uploader, ...v }) => ({
        ...v,
        uploaderName: personName(uploader as NameRow),
      }));
    },
  });
}

export function useFolderAccess(projectId: string | undefined, folderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: drawingKeys.access(projectId ?? "", folderId ?? ""),
    enabled: enabled && !!projectId && !!folderId,
    queryFn: async (): Promise<DrawingAccess[]> => {
      const { data, error } = await supabase
        .from("project_drawing_access")
        .select("*")
        .eq("folder_id", folderId as string);
      if (error) throw toError(error, "تعذر تحميل صلاحيات الوصول");
      return data ?? [];
    },
  });
}

/** The company-wide list a folder is picked from (Settings › الخرائط). */
export function useAllMapTypes(enabled = true) {
  return useQuery({
    queryKey: drawingKeys.mapTypes,
    enabled,
    queryFn: async (): Promise<MapType[]> => {
      const { data, error } = await supabase.from("map_types").select("*").order("name");
      if (error) throw toError(error, "تعذر تحميل أنواع الخرائط");
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------

function useInvalidateProject(projectId: string | undefined) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: drawingKeys.all(projectId ?? "") });
}

export function useAddDrawingFolder(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: async (mapTypeId: string) => {
      const { error } = await supabase
        .from("project_drawing_folders")
        .insert({ project_id: projectId as string, map_type_id: mapTypeId });
      if (error) throw toError(error, "تعذر إضافة نوع الخريطة");
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDrawingFolder(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: (folderId: string) => filesApiDelete(`/drawings/folders/${folderId}`),
    onSuccess: invalidate,
  });
}

export function useUploadDrawingVersion(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: ({
      folderId,
      file,
      notifyFolderIds,
      onProgress,
    }: {
      folderId: string;
      file: File;
      notifyFolderIds: string[];
      onProgress?: (fraction: number) => void;
    }) => {
      const query = notifyFolderIds.length ? `?notify=${notifyFolderIds.join(",")}` : "";
      return filesApiUpload<{ id: string; version: number }>(
        `/drawings/folders/${folderId}/versions${query}`,
        file,
        onProgress,
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDrawingVersion(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: (versionId: string) => filesApiDelete(`/drawings/versions/${versionId}`),
    onSuccess: invalidate,
  });
}

export function useDownloadDrawingVersion() {
  return useMutation({
    mutationFn: ({ versionId, fileName }: { versionId: string; fileName: string }) =>
      filesApiDownload(`/drawings/versions/${versionId}/file`, fileName),
  });
}

export function useSetDrawingStatus(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: async ({ folderId, status, note }: { folderId: string; status: DrawingStatus; note?: string }) => {
      const { error } = await supabase.rpc("project_drawing_set_status", {
        p_folder_id: folderId,
        p_status: status,
        p_note: note ?? undefined,
      });
      if (error) throw toError(error, "تعذر تحديث الحالة");
    },
    onSuccess: invalidate,
  });
}

export function useMarkNoticeComplied(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: async (noticeId: string) => {
      const { error } = await supabase.rpc("project_drawing_mark_complied", { p_notice_id: noticeId });
      if (error) throw toError(error, "تعذر تأكيد الالتزام");
    },
    onSuccess: invalidate,
  });
}

export interface AccessEntry {
  user_id: string;
  download: boolean;
  upload: boolean;
  edit: boolean;
}

export function useSetFolderAccess(projectId: string | undefined) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: async ({ folderId, entries }: { folderId: string; entries: AccessEntry[] }) => {
      const { error } = await supabase.rpc("project_drawing_set_access", {
        p_folder_id: folderId,
        p_entries: entries as unknown as Json,
      });
      if (error) throw toError(error, "تعذر حفظ صلاحيات الوصول");
    },
    onSuccess: invalidate,
  });
}
