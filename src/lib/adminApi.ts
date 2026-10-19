// src/lib/adminApi.ts
//
// Account management (create / delete / find a login, reset a password) goes
// through the `admin-users` Edge Function, which checks the signed-in person's
// permission and holds the service-role key. This app no longer contains that
// key. See supabase/functions/admin-users/README.md.
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type AdminUserKind = "employee" | "contractor" | "vendor" | "client";

export interface AdminAuthUser {
  id: string;
  email?: string;
  created_at?: string;
}

// Same shape the old supabaseAdmin.auth.admin.* calls returned, so call sites
// keep reading `{ data, error }` and `data.user`.
type AdminResult<T> =
  | { data: T; error: null }
  | { data: null; error: Error };

async function callAdminUsers<T>(body: Record<string, unknown>): Promise<AdminResult<T>> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });

  if (error) {
    // For a non-2xx answer the useful text is in the response body, not in
    // error.message ("Edge Function returned a non-2xx status code").
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        if (payload && typeof payload.error === "string") message = payload.error;
      } catch {
        /* keep the generic message */
      }
    }
    return { data: null, error: new Error(message) };
  }
  return { data: data as T, error: null };
}

/** Creates the login (auth user). The database trigger then creates the profile rows. */
export function adminCreateUser(
  kind: AdminUserKind,
  input: { email: string; password: string; userMetadata: Record<string, unknown> },
) {
  return callAdminUsers<{ user: AdminAuthUser }>({
    action: "create_user",
    kind,
    email: input.email,
    password: input.password,
    userMetadata: input.userMetadata,
  });
}

/** Removes a login created minutes ago (contractor / vendor) when linking it failed. */
export function adminDeleteUser(userId: string) {
  return callAdminUsers<{ ok: true }>({ action: "delete_user", userId });
}

/** One auth user by e-mail, or `user: null` if there is none. */
export function adminFindUser(email: string) {
  return callAdminUsers<{ user: AdminAuthUser | null }>({ action: "find_user", email });
}

/** Sets a new password and forces a change at the next login. */
export function adminResetPassword(userId: string, newPassword: string) {
  return callAdminUsers<{ ok: true }>({ action: "reset_password", userId, newPassword });
}
