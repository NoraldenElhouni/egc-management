import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

/**
 * A Supabase client that acts as the calling user: their JWT goes in
 * Authorization, so RLS and the RPCs' own checks apply exactly as they do in
 * the desktop app. The x-files-secret header is what the file-registering RPCs
 * look for (project_drawing_assert_files_service).
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-files-secret": config.filesServiceSecret,
      },
    },
  });
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Maps a PostgREST / Postgres error to an HTTP status with an Arabic message. */
export function fromPostgrest(error: PostgrestError): HttpError {
  switch (error.code) {
    case "42501":
      return new HttpError(403, error.message || "ليست لديك صلاحية لهذه العملية");
    case "P0002":
      return new HttpError(404, error.message || "غير موجود");
    case "22023":
    case "22P02":
      return new HttpError(400, error.message || "بيانات غير صالحة");
    case "PGRST301":
    case "PGRST302":
    case "PGRST303":
      return new HttpError(401, "انتهت الجلسة، يرجى تسجيل الدخول من جديد");
    default:
      return new HttpError(502, "تعذر الاتصال بقاعدة البيانات");
  }
}
