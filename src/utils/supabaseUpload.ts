import { supabase } from "../lib/supabaseClient";

/**
 * Create unique file path for uploaded files
 */
function createFilePath(prefix = "uploads", originalFileName = "") {
  const extMatch = originalFileName.match(/\.(\w+)$/);
  const ext = extMatch ? extMatch[1] : "jpg";
  const timestamp = Date.now();
  const rand = Math.floor(Math.random() * 1e6);
  return `${prefix}/${timestamp}_${rand}.${ext}`;
}

/**
 * Get content type from file extension
 */
function getContentType(fileName: string): string {
  const match = fileName.match(/\.(\w+)$/);
  const ext = match ? match[1].toLowerCase() : "jpg";
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

/**
 * Upload a single file to Supabase Storage
 * @param file - The File object to upload
 * @param bucket - The storage bucket name (default: "uploads")
 * @param folder - Optional folder prefix (default: "uploads")
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToSupabase(
  file: File,
  bucket = "uploads",
  folder = "uploads"
): Promise<string> {
  try {
    // Create unique file path
    const path = createFilePath(folder, file.name);
    const contentType = getContentType(file.name);

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;
    if (!data?.path) throw new Error("Upload failed: no path returned");

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of File objects to upload
 * @param bucket - The storage bucket name (default: "uploads")
 * @param folder - Optional folder prefix (default: "uploads")
 * @returns Array of public URLs
 */
export async function uploadFilesToSupabase(
  files: File[],
  bucket = "uploads",
  folder = "uploads"
): Promise<string[]> {
  if (!files?.length) return [];

  const uploadPromises = files.map((file) =>
    uploadFileToSupabase(file, bucket, folder)
  );

  return await Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param url - The public URL of the file to delete
 * @param bucket - The storage bucket name (default: "uploads")
 */
export async function deleteFileFromSupabase(
  url: string,
  bucket = "uploads"
): Promise<void> {
  try {
    // Support either a full public URL, a signed URL, or a direct path
    let filePath = url;

    // If the URL contains the Supabase public storage marker, extract the path
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    if (url.includes(publicMarker)) {
      filePath = decodeURIComponent(url.split(publicMarker)[1].split("?")[0]);
    } else if (url.includes(`${bucket}/`)) {
      // If the string contains '<bucket>/', assume the path follows it
      const parts = url.split(`${bucket}/`);
      filePath = decodeURIComponent(parts[parts.length - 1].split("?")[0]);
    } else {
      // Try to parse as URL and find the bucket segment in pathname
      try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        const bucketIdx = pathParts.indexOf(bucket);
        if (bucketIdx !== -1 && pathParts.length > bucketIdx + 1) {
          filePath = decodeURIComponent(
            pathParts.slice(bucketIdx + 1).join("/")
          );
        }
      } catch (e) {
        // If it's not a valid URL, assume it's already a file path
      }
    }

    if (!filePath) throw new Error("Invalid file path");

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
