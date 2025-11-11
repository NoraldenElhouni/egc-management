import { supabase } from "../lib/supabaseClient";
import { clearUserData, getUserData, saveUserData } from "../lib/userStorage";

export const authService = {
  // Login with Supabase
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile with role from your database
    const { data: profile } = await supabase
      .from("employees")
      .select("name, role")
      .eq("id", data.user.id)
      .single();

    // Save to local storage for fast access
    const userData = {
      id: data.user.id,
      name: profile?.name || data.user.email || "User",
      role: profile?.role || "user",
      email: data.user.email,
    };

    await saveUserData(userData);
    return userData;
  },

  // Logout
  async logout() {
    await supabase.auth.signOut();
    await clearUserData();
  },

  // Get current user from local storage (FAST)
  async getCurrentUser() {
    return await getUserData();
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const userData = await getUserData();
    return !!userData;
  },

  // Refresh user data from Supabase (when needed)
  async refreshUserData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await clearUserData();
      return null;
    }

    const { data: profile } = await supabase
      .from("employees")
      .select("name, role")
      .eq("id", user.id)
      .single();

    const userData = {
      id: user.id,
      name: profile?.name || user.email || "User",
      role: profile?.role || "user",
      email: user.email,
    };

    await saveUserData(userData);
    return userData;
  },
};
