import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID.test(value);

/**
 * Resolves a stored relative path (as kept in project_drawing_versions.file_path)
 * to an absolute path, refusing anything that would land outside the storage
 * root. The database already validates the shape on insert; this is the
 * second line of defence.
 */
export function resolveStored(relativePath: string): string {
  const absolute = path.resolve(config.storageRoot, relativePath);
  if (!absolute.startsWith(config.storageRoot + path.sep)) {
    throw new Error(`Refusing path outside storage root: ${relativePath}`);
  }
  return absolute;
}

/** Lowercase extension if it is short and alphanumeric, otherwise "bin". */
export function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : "bin";
}

/** drawings/<project>/<folder>/<uuid>.<ext>, the shape the RPC accepts. */
export function newDrawingPath(projectId: string, folderId: string, fileName: string): string {
  return `drawings/${projectId}/${folderId}/${randomUUID()}.${safeExtension(fileName)}`;
}

export async function tempFilePath(): Promise<string> {
  const dir = path.join(config.storageRoot, "tmp");
  await mkdir(dir, { recursive: true });
  return path.join(dir, randomUUID());
}

/** Moves a finished upload from tmp/ to its final place (same filesystem). */
export async function moveIntoPlace(tempPath: string, relativePath: string): Promise<string> {
  const target = resolveStored(relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await rename(tempPath, target);
  return target;
}

export async function removeQuietly(absolutePath: string): Promise<void> {
  await rm(absolutePath, { force: true });
}

export async function fileSize(absolutePath: string): Promise<number | null> {
  try {
    return (await stat(absolutePath)).size;
  } catch {
    return null;
  }
}

/**
 * Content-Disposition with an ASCII fallback plus the RFC 5987 UTF-8 name,
 * so Arabic file names survive the download.
 */
export function contentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "file";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
