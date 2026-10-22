import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8002),
  host: process.env.HOST ?? "0.0.0.0",

  // The Supabase project this instance serves (dev copy locally, production
  // on the EGC server). Only the public anon key: every request runs with the
  // caller's own JWT, so the database makes every permission decision.
  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),

  // Same value as the Vault secret `files_service_secret` in that project.
  // Lets the database tell this service apart from a user calling the
  // file-registering RPCs directly.
  filesServiceSecret: required("FILES_SERVICE_SECRET"),

  // Where files live on disk. In Docker this is a volume.
  storageRoot: path.resolve(process.env.STORAGE_ROOT ?? "./.storage"),

  maxFileBytes: Number(process.env.MAX_FILE_MB ?? 100) * 1024 * 1024,

  // Comma-separated list, or "*". Auth is a bearer token, never a cookie, so
  // CORS is not what protects the files; it only limits which pages may call.
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
