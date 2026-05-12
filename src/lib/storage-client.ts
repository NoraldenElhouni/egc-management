import { supabase } from "./supabaseClient";

type UploadEntity =
  | "work_request"
  | "contract"
  | "milestone_report"
  | "payment_request"
  | "employee"
  | "project";

interface UploadFileOptions {
  file: File;
  bucket?: string;

  entityType: UploadEntity;
  entityId: string;

  title?: string;
  uploadedBy: string;

  isPublic?: boolean;
}

export async function uploadFile({
  file,
  entityType,
  entityId,
  title,
  uploadedBy,
  bucket = "attachments",
  isPublic = false,
}: UploadFileOptions) {
  // safer filename
  const extension = file.name.split(".").pop();
  const cleanName = file.name.replace(/\s+/g, "-");
  const fileName = `${crypto.randomUUID()}.${extension}`;

  // final storage path
  const path = `${entityType}/${entityId}/${fileName}`;

  // upload to storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // optional public url
  let url: string | null = null;

  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    url = data.publicUrl;
  }

  // save attachment record
  const { data: attachment, error: dbError } = await await supabase
    .from("attachments")
    .insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        title: title || cleanName,
        file_name: cleanName,
        file_path: path,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy,
      },
    ])
    .select("*")
    .single();

  if (dbError) {
    throw new Error(dbError.message);
  }

  return {
    attachment,
    path,
    url,
  };
}
