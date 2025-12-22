import { supabase } from "../lib/supabaseClient";
import {
  clearUserData,
  getUserData,
  saveUserData,
  UserData,
} from "../lib/userStorage";

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
      .select("first_name, last_name, first_login")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (roleError) {
      console.error("Role fetch error:", roleError);
    }

    let userRole = null;
    if (roleData?.role_id) {
      const { data, error: userRoleError } = await supabase
        .from("roles")
        .select("name")
        .eq("id", roleData.role_id)
        .single();
      userRole = data;
      if (userRoleError) {
        console.error("User role fetch error:", userRoleError);
      }
    }

    // 3. Prepare user data
    const userData: UserData = {
      id: data.user.id,
      name:
        `${profile?.first_name} ${profile?.last_name}` ||
        data.user.email?.split("@")[0] ||
        "User",
      role: userRole?.name || "user",
      email: data.user.email,
      first_login: profile?.first_login || false,
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
      console.error("No authenticated user found during refresh");
      await clearUserData();
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, role_id, first_login")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    const { data: userRole, error: userRoleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile?.role_id || "")
      .single();

    if (userRoleError) {
      console.error("User role fetch error:", userRoleError);
    }

    const userData: UserData = {
      id: user.id,
      name:
        `${profile?.first_name} ${profile?.last_name}` ||
        user.email?.split("@")[0] ||
        "User",
      role: userRole?.name || "user",
      email: user.email,
      first_login: profile?.first_login || false,
    };

    await saveUserData(userData);
    return userData;
  },
};
