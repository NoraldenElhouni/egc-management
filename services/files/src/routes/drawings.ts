import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { fromPostgrest, HttpError, userClient } from "../supabase.js";
import {
  contentDisposition,
  fileSize,
  isUuid,
  moveIntoPlace,
  newDrawingPath,
  removeQuietly,
  resolveStored,
  tempFilePath,
} from "../storage.js";

type FolderParams = { folderId: string };
type VersionParams = { versionId: string };
type UploadQuery = { notify?: string };

function bearerToken(request: FastifyRequest): string {
  const header = request.headers.authorization ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, "يرجى تسجيل الدخول");
  return match[1];
}

function requireUuid(value: string): string {
  if (!isUuid(value)) throw new HttpError(400, "معرّف غير صالح");
  return value.toLowerCase();
}

export async function drawingsRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------
  // Upload a new version of a folder.
  // POST /drawings/folders/:folderId/versions?notify=<folderId>,<folderId>
  // multipart/form-data with one field named "file".
  // ---------------------------------------------------------------------
  app.post<{ Params: FolderParams; Querystring: UploadQuery }>(
    "/drawings/folders/:folderId/versions",
    async (request, reply) => {
      const token = bearerToken(request);
      const folderId = requireUuid(request.params.folderId);
      const notify = (request.query.notify ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(requireUuid);

      const db = userClient(token);

      // Check before reading a possibly 100 MB body.
      const { data: folder, error: folderError } = await db
        .from("project_drawing_folders")
        .select("project_id")
        .eq("id", folderId)
        .maybeSingle();
      if (folderError) throw fromPostgrest(folderError);
      if (!folder) throw new HttpError(404, "نوع الخريطة غير موجود");

      const { data: canUpload, error: capError } = await db.rpc("project_drawing_can", {
        p_folder_id: folderId,
        p_cap: "upload",
      });
      if (capError) throw fromPostgrest(capError);
      if (!canUpload) throw new HttpError(403, "ليست لديك صلاحية رفع ملفات لهذه الخرائط");

      const part = await request.file({ limits: { fileSize: config.maxFileBytes, files: 1 } });
      if (!part) throw new HttpError(400, "لم يتم إرسال ملف");

      const temp = await tempFilePath();
      try {
        await pipeline(part.file, createWriteStream(temp));
      } catch (error) {
        await removeQuietly(temp);
        throw error;
      }
      if (part.file.truncated) {
        await removeQuietly(temp);
        throw new HttpError(413, `حجم الملف يتجاوز الحد المسموح (${config.maxFileBytes / 1024 / 1024} ميغابايت)`);
      }

      const size = await fileSize(temp);
      const relativePath = newDrawingPath(folder.project_id as string, folderId, part.filename);
      const finalPath = await moveIntoPlace(temp, relativePath);

      const { data, error } = await db.rpc("project_drawing_add_version", {
        p_folder_id: folderId,
        p_file_path: relativePath,
        p_file_name: part.filename,
        p_mime_type: part.mimetype || null,
        p_file_size: size,
        p_notify_folder_ids: notify,
      });
      if (error) {
        await removeQuietly(finalPath);
        throw fromPostgrest(error);
      }

      const row = Array.isArray(data) ? data[0] : data;
      return reply.code(201).send({ id: row?.id, version: row?.version });
    },
  );

  // ---------------------------------------------------------------------
  // Download one version.
  // ---------------------------------------------------------------------
  app.get<{ Params: VersionParams }>("/drawings/versions/:versionId/file", async (request, reply) => {
    const token = bearerToken(request);
    const versionId = requireUuid(request.params.versionId);

    const { data, error } = await userClient(token).rpc("project_drawing_file_for_download", {
      p_version_id: versionId,
    });
    if (error) throw fromPostgrest(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new HttpError(404, "الملف غير موجود");

    const absolute = resolveStored(row.file_path);
    const size = await fileSize(absolute);
    if (size === null) {
      request.log.error({ versionId, path: row.file_path }, "drawing file missing on disk");
      throw new HttpError(404, "الملف غير موجود على الخادم");
    }

    return reply
      .header("Content-Type", row.mime_type || "application/octet-stream")
      .header("Content-Length", size)
      .header("Content-Disposition", contentDisposition(row.file_name))
      .header("Cache-Control", "private, no-store")
      .send(createReadStream(absolute));
  });

  // ---------------------------------------------------------------------
  // Delete one version / a whole folder. The RPC checks rights and deletes
  // the rows first; files are removed afterwards (an orphaned file is
  // harmless, a row pointing at a missing file is not).
  // ---------------------------------------------------------------------
  app.delete<{ Params: VersionParams }>("/drawings/versions/:versionId", async (request, reply) => {
    const token = bearerToken(request);
    const versionId = requireUuid(request.params.versionId);

    const { data, error } = await userClient(token).rpc("project_drawing_delete_version", {
      p_version_id: versionId,
    });
    if (error) throw fromPostgrest(error);

    await removeFiles(request, typeof data === "string" ? [data] : []);
    return reply.code(204).send();
  });

  app.delete<{ Params: FolderParams }>("/drawings/folders/:folderId", async (request, reply) => {
    const token = bearerToken(request);
    const folderId = requireUuid(request.params.folderId);

    const { data, error } = await userClient(token).rpc("project_drawing_delete_folder", {
      p_folder_id: folderId,
    });
    if (error) throw fromPostgrest(error);

    await removeFiles(request, Array.isArray(data) ? (data as string[]) : []);
    return reply.code(204).send();
  });
}

async function removeFiles(request: FastifyRequest, relativePaths: string[]) {
  for (const relativePath of relativePaths) {
    try {
      await removeQuietly(resolveStored(relativePath));
    } catch (error) {
      request.log.error({ err: error, path: relativePath }, "failed to remove drawing file");
    }
  }
}

export function sendError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof HttpError) {
    return reply.code(error.status).send({ message: error.message });
  }
  const code = (error as { code?: string }).code;
  if (code === "FST_REQ_FILE_TOO_LARGE") {
    return reply.code(413).send({
      message: `حجم الملف يتجاوز الحد المسموح (${config.maxFileBytes / 1024 / 1024} ميغابايت)`,
    });
  }
  if (code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
    return reply.code(400).send({ message: "يجب إرسال الملف كنموذج multipart" });
  }
  request.log.error({ err: error }, "unhandled error");
  return reply.code(500).send({ message: "حدث خطأ في خادم الملفات" });
}
