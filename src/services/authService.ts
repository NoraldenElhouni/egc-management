import { supabase } from "../lib/supabaseClient";
import {
  clearUserData,
  getUserData,
  saveUserData,
  UserData,
} from "../lib/userStorage";

// =====================================================================
// ONE source of truth for a user's role: user_roles
// =====================================================================
// This function exists because login() and refreshUserData() used to
// answer the same question from DIFFERENT tables:
//
//   login()           users -> user_roles -> roles.name
//   refreshUserData() users.role_id       -> roles.name
//
// AuthProvider loads the cached user, then calls refreshUserData() in
// the background. So a user's role could CHANGE a second after login,
// silently, without anything happening — and every `role === "Admin"`
// check in the app would flip with it. For the 38 accounts that have no
// user_roles row, login() produced the literal string "user" and the
// refresh then replaced it with their real role.
//
// user_roles is the winner, not users.role_id, because that is what the
// permission resolver reads (phase2-resolver.sql, DECISION 7). Any other
// choice would leave the app and the resolver disagreeing about who
// someone is, which is precisely the divergence this redesign exists to
// remove.
//
// ⚠️  CONSEQUENCE, DELIBERATE AND FLAGGED: an account with no user_roles
// row now resolves to "user" CONSISTENTLY, where previously the
// background refresh would upgrade it to users.role_id's value. Phase 0
// counted 38 such accounts. If any of them is a staff member who relies
// on role-gated screens, they lose that access here — the fix is to
// backfill their user_roles row, not to read the other table again.
// See phase7b-grants-worksheet.md.
async function fetchRoleName(userId: string): Promise<string | null> {
  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .maybeSingle();
  // maybeSingle, not single: 38 accounts legitimately have no row, and
  // .single() turned that into a logged error on every login.

  if (roleError) {
    console.error("Role fetch error:", roleError);
    return null;
  }
  if (!roleRow?.role_id) return null;

  const { data: role, error: nameError } = await supabase
    .from("roles")
    .select("name")
    .eq("id", roleRow.role_id)
    .maybeSingle();

  if (nameError) {
    console.error("Role name fetch error:", nameError);
    return null;
  }

  return role?.name ?? null;
}

export const authService = {
  // Login with email/password
  async login(email: string, password: string): Promise<UserData> {
    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("No user data returned");

    // 2. Fetch user profile with role from your profiles table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, first_login, status")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Block login for any non-active account (inactive, on leave, on holiday, ...)
    if (profile?.status && profile.status !== "active") {
      await supabase.auth.signOut();
      throw new Error("هذا الحساب غير مفعل حالياً. يرجى التواصل مع الإدارة.");
    }

    const roleName = await fetchRoleName(data.user.id);

    // 3. Prepare user data — fix: avoid "undefined undefined" name
    const userData: UserData = {
      id: data.user.id,
      name:
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
          : (data.user.email?.split("@")[0] ?? "User"),
      role: roleName || "user",
      email: data.user.email,
      first_login: profile?.first_login || false,
      status: profile?.status || "active",
    };

    // 4. Save to localForage for fast access next time
    await saveUserData(userData);

    return userData;
  },

  // Logout
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    await clearUserData();
  },

  // Get current user from local storage (FAST - no network)
  async getCurrentUser(): Promise<UserData | null> {
    return await getUserData();
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const userData = await getUserData();
    return !!userData;
  },

  // Refresh user data from Supabase (call when you need fresh data)
  async refreshUserData(): Promise<UserData | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No authenticated user found during refresh");
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, first_login, status")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Status was changed to non-active (e.g. by an admin) since the user logged in — force logout
    if (profile?.status && profile.status !== "active") {
      await this.logout();
      return null;
    }

    // Same helper as login(). If these two ever read different tables
    // again, the role will silently change a second after sign-in.
    const roleName = await fetchRoleName(user.id);

    // fix: avoid "undefined undefined" name
    const userData: UserData = {
      id: user.id,
      name:
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
          : (user.email?.split("@")[0] ?? "User"),
      role: roleName || "user",
      email: user.email,
      first_login: profile?.first_login || false,
      status: profile?.status || "active",
    };

    await saveUserData(userData);
    return userData;
  },
};
